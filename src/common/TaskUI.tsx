import { HStack, Spacer, Textarea, useToast, Button } from '@chakra-ui/react';
import React, { useCallback } from 'react';
import { debugMode } from '../constants';
import { useAppState } from '../state/store';
import RunTaskButton from './RunTaskButton';
import TaskHistory from './TaskHistory';
import TaskStatus from './TaskStatus';

const TaskUI = () => {
  const state = useAppState((state) => ({
    taskHistory: state.currentTask.history,
    taskStatus: state.currentTask.status,
    runTask: state.currentTask.actions.runTask,
    instructions: state.ui.instructions,
    setInstructions: state.ui.actions.setInstructions,
    memory: state.ui.memory,
    setMemory: state.ui.actions.setMemory,
    resume: state.ui.resume,
    setResume: state.ui.actions.setResume,
    page: state.settings.page,
    updateSettings: state.settings.actions.update,
  }));

  const taskInProgress = state.taskStatus === 'running';

  const toast = useToast();

  const toastError = useCallback(
    (message: string) => {
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    [toast]
  );

  const runTask = () => {
    state.instructions && state.runTask(toastError);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runTask();
    }
  };

  if (state.page !== 'default') {
    return (
      <>
        <div>{state.page}</div>
        {state.page === 'resume' ? (
          <Textarea
            autoFocus
            value={state.resume || ''}
            mb={2}
            onChange={(e) => state.setResume(e.target.value)}
            minH="200px"
          />
        ) : (
          <Textarea
            autoFocus
            value={state.memory || ''}
            mb={2}
            onChange={(e) => state.setMemory(e.target.value)}
            minH="200px"
          />
        )}
        <Button onClick={() => state.updateSettings({ page: 'default' })}>
          Save
        </Button>
      </>
    );
  }

  return (
    <>
      {state.taskStatus}
      <Textarea
        autoFocus
        placeholder="Recruiter AI uses OpenAI's GPT-4 API to apply for jobs for you. Enter your resume into the settings tab and ask it to apply to any job."
        value={state.instructions || ''}
        disabled={taskInProgress}
        onChange={(e) => state.setInstructions(e.target.value)}
        mb={2}
        onKeyDown={onKeyDown}
      />
      <HStack>
        <RunTaskButton runTask={runTask} />
        <Spacer />
        {debugMode && <TaskStatus />}
      </HStack>
      <TaskHistory />
    </>
  );
};

export default TaskUI;
