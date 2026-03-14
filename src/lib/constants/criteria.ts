import type { CriterionConfig } from '@/types'

export const DEFAULT_CRITERIA: CriterionConfig[] = [
  {
    key: 'innovation',
    label: 'Innovation & Originality',
    weight: 0.25,
    description: 'How novel and surprising is this project?',
    subQuestions: [
      'Does this take a genuinely novel angle on the problem?',
      'Is there a surprising or creative tech combination at play?',
      'Would this project plausibly exist without the hackathon as forcing function?',
    ],
  },
  {
    key: 'technical_execution',
    label: 'Technical Execution',
    weight: 0.20,
    description: 'Quality and cleverness of the engineering',
    subQuestions: [
      'Are there clever solutions that go beyond the obvious approach?',
      'Is the ambition appropriate and impressive for a 24-hour window?',
      'Is there any novel or non-standard use of APIs or frameworks?',
    ],
  },
  {
    key: 'functional_completeness',
    label: 'Functional Completeness',
    weight: 0.20,
    description: 'Does the core loop actually work?',
    subQuestions: [
      'Does the primary use-case work end-to-end?',
      'Does it meet MVP quality standards?',
      'Does it handle at least some edge cases gracefully?',
    ],
  },
  {
    key: 'problem_solution_fit',
    label: 'Problem-Solution Fit',
    weight: 0.15,
    description: 'Is this solving a real problem convincingly?',
    subQuestions: [
      'Is there a real, tangible need being addressed?',
      'Is the target user clearly understood?',
      'Does the solution actually address the stated problem?',
    ],
  },
  {
    key: 'ux_design',
    label: 'UX & Design',
    weight: 0.10,
    description: 'Visual polish and usability',
    subQuestions: [
      'Is there clear visual hierarchy and consistent design?',
      'Could a new user navigate it without guidance?',
      'Is there a distinct visual identity or brand?',
    ],
  },
  {
    key: 'demo_communication',
    label: 'Demo & Communication',
    weight: 0.05,
    description: 'How clearly is the project communicated?',
    subQuestions: [
      'Does the pitch clearly explain what it does and why?',
      'Does the demo highlight the most impressive parts?',
    ],
  },
  {
    key: 'learning_ambition',
    label: 'Learning & Ambition',
    weight: 0.05,
    description: 'Did they stretch themselves?',
    subQuestions: [
      'Did the team tackle something new or unfamiliar for them?',
      'Is there evidence of genuine learning or experimentation?',
    ],
  },
]

export const CRITERIA_BY_KEY = Object.fromEntries(
  DEFAULT_CRITERIA.map((c) => [c.key, c])
)
