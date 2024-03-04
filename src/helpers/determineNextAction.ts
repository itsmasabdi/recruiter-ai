import OpenAI from 'openai';
import { useAppState } from '../state/store';
import { availableActions, tools } from './availableActions';
import { ParsedResponseSuccess } from './parseResponse';

const systemMessage = `
You are a browser automation assistant that is helping the user apply for jobs.

You will be be given a task to perform and the current state of the DOM. You will also be given previous actions that you have taken. You may retry a failed action up to one time.

Use the provided tools to interact with the DOM. You may also ask the user for input. Try not to ask any questions unelss it is very important to the task.

DO NOT REPEAT ANY TASKS THAT YOU HAVE PERFORMED BEFORE!
`;

//Use user's email and fixed password (Password!23) to login if you have already created an account. If not create an account first.

export async function determineNextAction(
  taskInstructions: string,
  previousActions: ParsedResponseSuccess[],
  simplifiedDOM: string,
  maxAttempts = 3,
  notifyError?: (error: string) => void
) {
  const model = useAppState.getState().settings.selectedModel;
  const resume = useAppState.getState().ui.resume;
  const memory = useAppState.getState().ui.memory;
  const prompt = formatPrompt(
    taskInstructions,
    previousActions,
    resume,
    memory,
    simplifiedDOM
  );
  const key = useAppState.getState().settings.openAIKey;
  if (!key) {
    notifyError?.('No OpenAI key found');
    return null;
  }

  const openai = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        tools: tools as any,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          { role: 'user', content: prompt },
        ],
        // max_tokens: 2048,
        temperature: 0,
      });

      // console.log('determineNextAction completion', completion);

      return {
        usage: completion.usage?.total_tokens,
        prompt,
        response: completion.choices[0].message,
      };
    } catch (error: any) {
      console.log('determineNextAction error', error);
      if (error.response.data.error.message.includes('server error')) {
        // Problem with the OpenAI API, try again
        if (notifyError) {
          notifyError(error.response.data.error.message);
        }
      } else {
        // Another error, give up
        throw new Error(error.response.data.error.message);
      }
    }
  }
  throw new Error(
    `Failed to complete query after ${maxAttempts} attempts. Please try again later.`
  );
}

export function formatPrompt(
  taskInstructions: string,
  previousActions: ParsedResponseSuccess[],
  resume: string | null,
  memory: string | null,
  pageContents: string
) {
  let previousActionsString = '';

  console.log('previousActions', previousActions);

  if (previousActions.length > 0) {
    const lastFiveActions = previousActions.slice(
      Math.max(previousActions.length - 15, 0)
    );
    const serializedActions = lastFiveActions
      .map((action) =>
        JSON.stringify({
          action: action.parsedAction,
          thought: action.thought,
        })
      )
      .join('\n\n');
    previousActionsString = `You have already taken the following actions: \n${serializedActions}\n\n`;
  }

  return `TASK INSTRUCTIONS:
${taskInstructions}

RESUME:
${resume}

${memory}

CURRENT TIME:
${new Date().toLocaleString()}

CURRENT PAGE CONTENTS:
${pageContents}

PREVIOUS ACTIONS TAKEN:
${previousActionsString}`;
}
