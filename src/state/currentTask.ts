import { attachDebugger, detachDebugger } from '../helpers/chromeDebugger';
import {
  disableIncompatibleExtensions,
  reenableExtensions,
} from '../helpers/disableExtensions';
import { callDOMAction } from '../helpers/domActions';
import {
  ParsedResponse,
  ParsedResponseSuccess,
  parseResponse,
} from '../helpers/parseResponse';
import { determineNextAction } from '../helpers/determineNextAction';
import templatize from '../helpers/shrinkHTML/templatize';
import { getSimplifiedDom } from '../helpers/simplifyDom';
import { sleep, truthyFilter } from '../helpers/utils';
import { MyStateCreator } from './store';

export type TaskHistoryEntry = {
  prompt: string;
  response: string;
  action: ParsedResponse;
  usage: number | null;
};

export type CurrentTaskSlice = {
  tabId: number;
  instructions: string | null;
  history: TaskHistoryEntry[];
  status: 'pending' | 'idle' | 'running' | 'success' | 'error' | 'interrupted';
  actionStatus:
    | 'idle'
    | 'attaching-debugger'
    | 'pulling-dom'
    | 'transforming-dom'
    | 'performing-query'
    | 'performing-action'
    | 'waiting';
  actions: {
    runTask: (onError: (error: string) => void) => Promise<void>;
    setStatus: (status: CurrentTaskSlice['status']) => void;
    interrupt: () => void;
  };
};
export const createCurrentTaskSlice: MyStateCreator<CurrentTaskSlice> = (
  set,
  get
) => ({
  tabId: -1,
  instructions: null,
  history: [],
  status: 'idle',
  actionStatus: 'idle',
  actions: {
    setStatus: (status: CurrentTaskSlice['status']) => {
      set((state) => {
        state.currentTask.status = status;
      });
    },
    runTask: async (onError) => {
      const wasStopped = () =>
        get().currentTask.status !== 'running' &&
        get().currentTask.status !== 'pending';
      const setActionStatus = (status: CurrentTaskSlice['actionStatus']) => {
        set((state) => {
          state.currentTask.actionStatus = status;
        });
      };

      const instructions = get().ui.instructions;

      if (!instructions || get().currentTask.status === 'running') return;

      set((state) => {
        state.currentTask.instructions = instructions;
        state.currentTask.history = [];
        state.currentTask.status = 'running';
        state.currentTask.actionStatus = 'attaching-debugger';
      });

      try {
        const activeTab = (
          await chrome.tabs.query({ active: true, currentWindow: true })
        )[0];

        if (!activeTab.id) throw new Error('No active tab found');
        const tabId = activeTab.id;
        set((state) => {
          state.currentTask.tabId = tabId;
        });

        await attachDebugger(tabId);
        await disableIncompatibleExtensions();

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (wasStopped()) break;
          if (get().currentTask.status === 'pending') {
            await new Promise((resolve) => {
              const interval = setInterval(() => {
                if (get().currentTask.status === 'running') {
                  clearInterval(interval);
                  resolve(undefined);
                }
              }, 1000);
            });
          }

          setActionStatus('pulling-dom');
          const pageDOM = await getSimplifiedDom();

          // console.log('pageDOM', pageDOM);
          if (!pageDOM) {
            set((state) => {
              state.currentTask.status = 'error';
            });
            break;
          }
          const html = pageDOM.outerHTML;

          if (wasStopped()) break;
          setActionStatus('transforming-dom');
          const currentDom = templatize(html);
          // console.log('currentDom', currentDom);

          const previousActions = get()
            .currentTask.history.map((entry) => entry.action)
            .filter(truthyFilter);

          setActionStatus('performing-query');

          const query = await determineNextAction(
            instructions,
            previousActions.filter(
              (pa) => !('error' in pa)
            ) as ParsedResponseSuccess[],
            currentDom,
            3,
            onError
          );

          // if (!query) {
          //   set((state) => {
          //     state.currentTask.status = 'error';
          //   });
          //   break;
          // }

          // console.log(query);

          if (wasStopped()) break;

          console.log(JSON.stringify(query?.response, null, 2));
          setActionStatus('performing-action');
          // const action = parseResponse(query.response);

          const actions = query?.response?.tool_calls.map((tool_call: any) => {
            return {
              parsedAction: tool_call.function,
              actionString: '',
              thought: JSON.parse(tool_call.function.arguments || '{}').thought,
            };
          });

          for (const action of actions) {
            set((state) => {
              state.currentTask.history.push({
                prompt: query.prompt,
                response: JSON.stringify(query.response),
                action,
                usage: 120,
              });
            });
            if ('error' in action) {
              onError(action.error);
              break;
            }

            console.log('action', JSON.stringify(action, null, 2));

            if (
              action === null ||
              action.parsedAction?.name === 'finish' ||
              action.parsedAction?.name === 'fail'
            ) {
              break;
            }

            if (action.parsedAction?.name === 'click') {
              await callDOMAction(
                'click',
                JSON.parse(action.parsedAction?.arguments || '{}')
              );
            } else if (action.parsedAction?.name === 'setValue') {
              await callDOMAction(
                action?.parsedAction?.name,
                JSON.parse(action?.parsedAction?.arguments || '{}')
              );
            } else if (action.parsedAction?.name === 'askUser') {
              set((state) => {
                state.currentTask.status = 'pending';
              });
            }

            await sleep(500);
          }
          const failedOrFinished = actions?.find(
            (a) =>
              a.parsedAction?.name === 'fail' ||
              a.parsedAction?.name === 'finish'
          );
          if (failedOrFinished) {
            break;
          }

          if (wasStopped()) break;

          // While testing let's automatically stop after 50 actions to avoid
          // infinite loops
          if (get().currentTask.history.length >= 50) {
            break;
          }

          setActionStatus('waiting');
          // sleep 2 seconds. This is pretty arbitrary; we should figure out a better way to determine when the page has settled.
          await sleep(500);
        }
        set((state) => {
          state.currentTask.status = 'success';
        });
      } catch (e: any) {
        onError(e.message);
        set((state) => {
          state.currentTask.status = 'error';
        });
      } finally {
        await detachDebugger(get().currentTask.tabId);
        await reenableExtensions();
      }
    },
    interrupt: () => {
      set((state) => {
        state.currentTask.status = 'interrupted';
      });
    },
  },
});
