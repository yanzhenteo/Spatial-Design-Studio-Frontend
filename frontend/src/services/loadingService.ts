// src/services/loadingService.ts

export interface DementiaFactOrMyth {
  id: number;
  statement: string;
  isFact: boolean;
  explanation: string;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Parse the dementia myths and facts
export const dementiaData: DementiaFactOrMyth[] = [
  {
    id: 1,
    statement: "Dementia is a disease.",
    isFact: false,
    explanation: "Dementia is not a disease, but general term for decline in thinking and memory skills that interferes with daily activities. Alzheimer's disease is one of the causes of dementia."
  },
  {
    id: 2,
    statement: "Memory loss is always the first sign of dementia.",
    isFact: false,
    explanation: "Dementia is very broad, with many different types. Hence, initial symptoms of dementia may vary from person to person."
  },
  {
    id: 3,
    statement: "Dementia is a natural part of aging.",
    isFact: false,
    explanation: "It is simply more common as people get older, similar to health conditions like heart disease, stroke and cancer."
  },
  {
    id: 4,
    statement: "Dementia is always genetic.",
    isFact: false,
    explanation: "There is no solid evidence to prove that dementia is genetic, although there are cases of special genetic variants that increase risk of dementia."
  },
  {
    id: 5,
    statement: "Alzheimer's causes the loss of all memories.",
    isFact: false,
    explanation: "Alzheimer's disease does cause loss of memories, but memories from childhood through age 35 or so are generally remembered before the late stages. This is because the hippocampus, one part of the brain that is damaged in Alzheimer's, oversees recent memories and not older memories."
  },
  {
    id: 6,
    statement: "There is a way to reducing the risk of dementia.",
    isFact: true,
    explanation: "Studies have shown that by engaging in good lifestyle behaviors — such as eating a Mediterranean diet and doing aerobic exercise that strengthens your heart and lungs, you can reduce the risk of developing Alzheimer's disease, even with high risk genetics."
  },
  {
    id: 7,
    statement: "Dementia can affect younger people.",
    isFact: true,
    explanation: "While people over 65 are most likely to get dementia, it can affect younger people, too, even children. When this happens, it's known as early onset dementia."
  },
  {
    id: 8,
    statement: "Alzheimer's disease is a type of dementia.",
    isFact: true,
    explanation: "Dementia is an umbrella term used to describe a collection of symptoms associated with cognitive impairment. It refers to the decline in cognitive abilities severe enough to interfere with daily activities."
  },
  {
    id: 9,
    statement: "Dementia causes patients to lose their sense of self completely.",
    isFact: false,
    explanation: "While a person living in the later stages of dementia may not always be able to communicate with you directly, they can still recognize and understand the feelings behind your actions and words. It's important to try to reach the person through all the senses, such as by touch or listening to music."
  },
  {
    id: 10,
    statement: "Dementia patients, in the early stages, can take care of themselves.",
    isFact: true,
    explanation: "A person living in the early stages of dementia only has mild impairment due to symptoms. If you think they need help, it's respectful to ask first rather than assume."
  }
];

// Get shuffled facts and myths
export function getShuffledDementiaData(): DementiaFactOrMyth[] {
  return shuffleArray(dementiaData);
}
