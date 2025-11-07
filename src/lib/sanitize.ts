import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML input to prevent XSS attacks
 * Allows safe HTML tags while removing potentially dangerous content
 */
export function sanitizeInput(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return sanitizeHtml(dirty, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'a', 'span', 'div'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'span': ['style'],
      'div': ['style'],
      'p': ['style']
    },
    allowedStyles: {
      '*': {
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
        'text-align': [/^left$/, /^right$/, /^center$/],
        'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
        'font-style': [/^italic$/, /^normal$/],
        'text-decoration': [/^underline$/, /^none$/]
      }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto']
    },
    // Enforce target="_blank" and rel="noopener noreferrer" for links
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        };
      }
    }
  });
}

/**
 * Sanitize plain text input (no HTML allowed)
 * Use for fields like job titles, names, etc.
 */
export function sanitizePlainText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

/**
 * Validate and sanitize career data
 */
export function sanitizeCareerData(data: any) {
  const sanitized: any = {};

  // Sanitize plain text fields
  if (data.jobTitle) {
    sanitized.jobTitle = sanitizePlainText(data.jobTitle).trim();
  }
  
  if (data.location) {
    sanitized.location = sanitizePlainText(data.location).trim();
  }

  if (data.workSetup) {
    sanitized.workSetup = sanitizePlainText(data.workSetup).trim();
  }

  if (data.workSetupRemarks) {
    sanitized.workSetupRemarks = sanitizePlainText(data.workSetupRemarks).trim();
  }

  if (data.country) {
    sanitized.country = sanitizePlainText(data.country).trim();
  }

  if (data.province) {
    sanitized.province = sanitizePlainText(data.province).trim();
  }

  if (data.employmentType) {
    sanitized.employmentType = sanitizePlainText(data.employmentType).trim();
  }

  // Sanitize HTML fields
  if (data.description) {
    sanitized.description = sanitizeInput(data.description);
  }

  if (data.cvSecretPrompt) {
    sanitized.cvSecretPrompt = sanitizeInput(data.cvSecretPrompt);
  }

  if (data.aiInterviewSecretPrompt) {
    sanitized.aiInterviewSecretPrompt = sanitizeInput(data.aiInterviewSecretPrompt);
  }

  // Sanitize questions array
  if (data.questions && Array.isArray(data.questions)) {
    sanitized.questions = data.questions.map((group: any) => ({
      category: sanitizePlainText(group.category || ''),
      questions: Array.isArray(group.questions) 
        ? group.questions.map((q: any) => ({
            question: sanitizePlainText(q.question || ''),
            type: sanitizePlainText(q.type || ''),
            options: Array.isArray(q.options) 
              ? q.options.map((opt: string) => sanitizePlainText(opt))
              : []
          }))
        : []
    }));
  }

  // Sanitize pre-screening questions
  if (data.preScreeningQuestions && Array.isArray(data.preScreeningQuestions)) {
    sanitized.preScreeningQuestions = data.preScreeningQuestions.map((q: any) => ({
      question: sanitizePlainText(q.question || ''),
      type: sanitizePlainText(q.type || ''),
      required: Boolean(q.required),
      options: Array.isArray(q.options)
        ? q.options.map((opt: string) => sanitizePlainText(opt))
        : []
    }));
  }

  // Pass through safe fields
  const safeFields = [
    'orgID', 'requireVideo', 'screeningSetting', 'status',
    'salaryNegotiable', 'minimumSalary', 'maximumSalary',
    'aiInterviewScreening', 'unpublishedLatestStep',
    'lastEditedBy', 'createdBy', '_id'
  ];

  safeFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });

  return sanitized;
}
