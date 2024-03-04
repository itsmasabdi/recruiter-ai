export const availableActions = [
  {
    name: 'click',
    description: 'Clicks on an element',
    args: [
      {
        name: 'elementId',
        type: 'number',
      },
    ],
  },
  {
    name: 'setValue',
    description: 'Focuses on and sets the value of an input element',
    args: [
      {
        name: 'elementId',
        type: 'number',
      },
      {
        name: 'value',
        type: 'string',
      },
    ],
  },
  {
    name: 'finish',
    description: 'Indicates the task is finished',
    args: [],
  },
  {
    name: 'fail',
    description: 'Indicates that you are unable to complete the task',
    args: [],
  },
  {
    name: 'askUser',
    description: 'Asks the user for input',
    args: [
      {
        name: 'question',
        type: 'string',
      },
    ],
  },
] as const;

export const tools = [
  {
    type: 'function',
    function: {
      name: 'click',
      description: 'Clicks on an element',
      parameters: {
        type: 'object',
        properties: {
          thought: {
            type: 'string',
            description: 'The thinking behind this action. ',
          },
          elementId: {
            type: 'number',
            description: 'The unique identifier for the element to be clicked',
          },
        },
        required: ['thought', 'elementId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'setValue',
      description: 'Focuses on and sets the value of an input element',
      parameters: {
        type: 'object',
        properties: {
          thought: {
            type: 'string',
            description: 'The thinking behind this action. ',
          },
          elementId: {
            type: 'number',
            description: 'The unique identifier for the input element',
          },
          value: {
            type: 'string',
            description: 'The value to set for the input element',
          },
        },
        required: ['thought', 'elementId', 'value'],
      },
    },
  },
  // {
  //   type: 'function',
  //   function: {
  //     name: 'finish',
  //     description: 'Indicates the task is finished',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         thought: {
  //           type: 'string',
  //           description: 'The thinking behind this action. ',
  //         },
  //       },
  //       required: ['thought'],
  //     },
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: 'fail',
  //     description: 'Indicates that you are unable to complete the task',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         thought: {
  //           type: 'string',
  //           description: 'The thinking behind this action. ',
  //         },
  //       },
  //       required: ['thought'],
  //     },
  //   },
  // },
  {
    type: 'function',
    function: {
      name: 'askUser',
      description: 'Asks the user for input',
      parameters: {
        type: 'object',
        properties: {
          thought: {
            type: 'string',
            description: 'The thinking behind this action. ',
          },
          question: {
            type: 'string',
            description: 'The question to ask the user',
          },
        },
        required: ['thought', 'question'],
      },
    },
  },
] as const;

type AvailableAction = (typeof availableActions)[number];

type ArgsToObject<T extends ReadonlyArray<{ name: string; type: string }>> = {
  [K in T[number]['name']]: Extract<
    T[number],
    { name: K }
  >['type'] extends 'number'
    ? number
    : string;
};

export type ActionShape<
  T extends {
    name: string;
    args: ReadonlyArray<{ name: string; type: string }>;
  }
> = {
  name: T['name'];
  args: ArgsToObject<T['args']>;
};

export type ActionPayload = {
  [K in AvailableAction['name']]: ActionShape<
    Extract<AvailableAction, { name: K }>
  >;
}[AvailableAction['name']];
