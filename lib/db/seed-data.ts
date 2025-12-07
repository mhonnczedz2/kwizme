import { QuizGenerationResponse } from './types';

/**
 * Default quizzes to populate on first app launch
 * These serve as examples and starter content for new users
 */
export const SEED_QUIZZES: QuizGenerationResponse[] = [
  {
    quiz_id: 'seed-quiz-1',
    quiz_title: 'Introduction to JavaScript',
    file_name: 'javascript-basics.pdf',
    description: 'Test your knowledge of JavaScript fundamentals including variables, functions, and control flow.',
    institution: 'KwizMe',
    program: 'Computer Science',
    course: 'Web Development',
    course_code: 'CS101',
    topic: 'JavaScript Basics',
    difficulty_level: 'easy',
    questions: [
      {
        question: 'What keyword is used to declare a variable in JavaScript?',
        options: ['var', 'let', 'const', 'All of the above'],
        correct_answer: 'All of the above',
        explanation: 'JavaScript has three keywords for variable declaration: var (function-scoped), let (block-scoped), and const (block-scoped constant).',
        difficulty: 'easy'
      },
      {
        question: 'What is the output of: console.log(typeof null)?',
        options: ['null', 'undefined', 'object', 'number'],
        correct_answer: 'object',
        explanation: 'This is a known quirk in JavaScript. typeof null returns "object" due to a historical bug in the language.',
        difficulty: 'easy'
      },
      {
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correct_answer: 'push()',
        explanation: 'The push() method adds one or more elements to the end of an array and returns the new length.',
        difficulty: 'easy'
      },
      {
        question: 'What does the === operator do in JavaScript?',
        options: ['Assignment', 'Comparison with type coercion', 'Strict equality comparison', 'Logical AND'],
        correct_answer: 'Strict equality comparison',
        explanation: 'The === operator checks for equality without type coercion, meaning both value and type must match.',
        difficulty: 'easy'
      },
      {
        question: 'How do you create a function in JavaScript?',
        options: ['function myFunc() {}', 'const myFunc = () => {}', 'const myFunc = function() {}', 'All of the above'],
        correct_answer: 'All of the above',
        explanation: 'JavaScript supports multiple function syntaxes: function declarations, arrow functions, and function expressions.',
        difficulty: 'easy'
      },
    ]
  },
  {
    quiz_id: 'seed-quiz-2',
    quiz_title: 'Basic Mathematics',
    file_name: 'math-fundamentals.pdf',
    description: 'Review fundamental mathematical concepts including arithmetic, algebra, and geometry.',
    institution: 'KwizMe',
    program: 'Mathematics',
    course: 'General Mathematics',
    course_code: 'MATH100',
    topic: 'Fundamentals',
    difficulty_level: 'easy',
    questions: [
      {
        question: 'What is 15% of 200?',
        options: ['20', '25', '30', '35'],
        correct_answer: '30',
        explanation: 'To find 15% of 200: (15/100) × 200 = 30',
        difficulty: 'easy'
      },
      {
        question: 'What is the value of 2³ + 3²?',
        options: ['13', '15', '17', '19'],
        correct_answer: '17',
        explanation: '2³ = 8 and 3² = 9, so 8 + 9 = 17',
        difficulty: 'easy'
      },
      {
        question: 'If a triangle has angles of 90° and 45°, what is the third angle?',
        options: ['30°', '45°', '60°', '90°'],
        correct_answer: '45°',
        explanation: 'The sum of angles in a triangle is 180°. So 180° - 90° - 45° = 45°',
        difficulty: 'easy'
      },
      {
        question: 'What is the square root of 144?',
        options: ['10', '11', '12', '13'],
        correct_answer: '12',
        explanation: '12 × 12 = 144, therefore √144 = 12',
        difficulty: 'easy'
      },
      {
        question: 'Solve for x: 3x + 5 = 20',
        options: ['3', '4', '5', '6'],
        correct_answer: '5',
        explanation: 'Subtract 5 from both sides: 3x = 15. Divide by 3: x = 5',
        difficulty: 'easy'
      },
    ]
  },
  {
    quiz_id: 'seed-quiz-3',
    quiz_title: 'World Geography',
    file_name: 'geography-basics.pdf',
    description: 'Test your knowledge of continents, countries, capitals, and geographical features.',
    institution: 'KwizMe',
    program: 'Geography',
    course: 'World Geography',
    course_code: 'GEO101',
    topic: 'Countries and Capitals',
    difficulty_level: 'medium',
    questions: [
      {
        question: 'What is the capital of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
        correct_answer: 'Canberra',
        explanation: 'While Sydney is the largest city, Canberra is the capital of Australia.',
        difficulty: 'medium'
      },
      {
        question: 'Which continent has the most countries?',
        options: ['Asia', 'Africa', 'Europe', 'South America'],
        correct_answer: 'Africa',
        explanation: 'Africa has 54 recognized countries, the most of any continent.',
        difficulty: 'medium'
      },
      {
        question: 'What is the longest river in the world?',
        options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
        correct_answer: 'Nile',
        explanation: 'The Nile River in Africa is approximately 6,650 km long, making it the longest river.',
        difficulty: 'medium'
      },
      {
        question: 'Which ocean is the largest?',
        options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
        correct_answer: 'Pacific',
        explanation: 'The Pacific Ocean covers approximately 165 million square kilometers.',
        difficulty: 'medium'
      },
      {
        question: 'What is the smallest country in the world?',
        options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
        correct_answer: 'Vatican City',
        explanation: 'Vatican City is the smallest country with an area of approximately 0.44 square kilometers.',
        difficulty: 'medium'
      },
    ]
  }
];
