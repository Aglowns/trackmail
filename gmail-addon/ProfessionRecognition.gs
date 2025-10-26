/**
 * Comprehensive Profession Recognition System
 * 
 * This file contains a comprehensive database of job titles across all industries
 * and advanced functions to recognize and classify professions in job application emails.
 * 
 * Based on industry standards and Careerflow.ai's approach for maximum accuracy.
 */

/**
 * Comprehensive Job Title Database
 * Covers all major industries and professions with 200+ job titles
 */
const JOB_TITLES_DATABASE = {
  // Technology & Engineering
  technology: [
    'Software Engineer', 'Software Developer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'DevOps Engineer', 'Cloud Engineer', 'Security Engineer',
    'Data Engineer', 'Machine Learning Engineer', 'AI Engineer', 'QA Engineer',
    'Test Engineer', 'Systems Engineer', 'Network Engineer', 'Database Engineer',
    'Mobile Developer', 'iOS Developer', 'Android Developer', 'Web Developer',
    'UI Developer', 'UX Developer', 'Game Developer', 'Blockchain Developer',
    'Cybersecurity Engineer', 'IT Engineer', 'Platform Engineer', 'Site Reliability Engineer',
    'Software Architect', 'Technical Lead', 'Engineering Manager', 'CTO',
    'Solutions Architect', 'Integration Engineer', 'Automation Engineer', 'Performance Engineer'
  ],
  
  // Data & Analytics
  data: [
    'Data Scientist', 'Data Analyst', 'Business Analyst', 'Financial Analyst',
    'Research Analyst', 'Marketing Analyst', 'Operations Analyst', 'Product Analyst',
    'Risk Analyst', 'Credit Analyst', 'Investment Analyst', 'Data Architect',
    'Database Administrator', 'Statistician', 'Quantitative Analyst', 'Machine Learning Engineer',
    'AI Researcher', 'Data Visualization Specialist', 'Business Intelligence Analyst',
    'Data Engineer', 'Analytics Manager', 'Data Science Manager', 'Research Scientist',
    'Economist', 'Actuary', 'Market Research Analyst', 'Operations Research Analyst'
  ],
  
  // Healthcare & Medical
  healthcare: [
    'Doctor', 'Physician', 'Nurse', 'Registered Nurse', 'Nurse Practitioner',
    'Physician Assistant', 'Medical Assistant', 'Pharmacist', 'Dentist',
    'Veterinarian', 'Physical Therapist', 'Occupational Therapist', 'Speech Therapist',
    'Psychologist', 'Psychiatrist', 'Social Worker', 'Medical Technologist',
    'Radiologist', 'Surgeon', 'Pediatrician', 'Cardiologist', 'Dermatologist',
    'Emergency Medicine Physician', 'Family Medicine Physician', 'Internal Medicine Physician',
    'Anesthesiologist', 'Orthopedic Surgeon', 'Neurologist', 'Oncologist',
    'Gynecologist', 'Urologist', 'Ophthalmologist', 'ENT Specialist',
    'Pathologist', 'Radiology Technician', 'Lab Technician', 'Pharmacy Technician',
    'Medical Coder', 'Health Information Manager', 'Clinical Research Coordinator'
  ],
  
  // Education & Academia
  education: [
    'Teacher', 'Professor', 'Assistant Professor', 'Associate Professor',
    'Lecturer', 'Instructor', 'Principal', 'Vice Principal', 'Dean',
    'Academic Advisor', 'Curriculum Developer', 'Education Coordinator',
    'School Counselor', 'Librarian', 'Research Assistant', 'Teaching Assistant',
    'Substitute Teacher', 'Special Education Teacher', 'ESL Teacher',
    'Department Head', 'Academic Director', 'Student Affairs Coordinator',
    'Admissions Officer', 'Career Counselor', 'Education Consultant',
    'Training Specialist', 'Instructional Designer', 'Educational Technology Specialist'
  ],
  
  // Business & Management
  business: [
    'Manager', 'Project Manager', 'Product Manager', 'Program Manager',
    'Operations Manager', 'Sales Manager', 'Marketing Manager', 'HR Manager',
    'Finance Manager', 'Account Manager', 'Business Development Manager',
    'General Manager', 'Regional Manager', 'District Manager', 'Store Manager',
    'Team Lead', 'Supervisor', 'Director', 'VP', 'CEO', 'COO', 'CFO', 'CTO',
    'Executive Director', 'Managing Director', 'Business Analyst', 'Strategy Manager',
    'Operations Director', 'Sales Director', 'Marketing Director', 'HR Director',
    'Finance Director', 'Business Development Director', 'Regional Director'
  ],
  
  // Sales & Marketing
  sales_marketing: [
    'Sales Representative', 'Account Executive', 'Business Development Representative',
    'Sales Manager', 'Sales Director', 'Marketing Specialist', 'Marketing Manager',
    'Digital Marketing Specialist', 'Content Marketing Manager', 'Social Media Manager',
    'Brand Manager', 'Product Marketing Manager', 'Marketing Analyst', 'SEO Specialist',
    'PPC Specialist', 'Email Marketing Specialist', 'Marketing Coordinator',
    'Sales Engineer', 'Account Manager', 'Customer Success Manager', 'Sales Operations Manager',
    'Marketing Operations Manager', 'Growth Manager', 'Demand Generation Manager',
    'Marketing Automation Specialist', 'Content Creator', 'Copywriter', 'Marketing Director'
  ],
  
  // Finance & Banking
  finance: [
    'Financial Analyst', 'Investment Banker', 'Financial Advisor', 'Portfolio Manager',
    'Risk Manager', 'Credit Analyst', 'Loan Officer', 'Banker', 'Treasury Analyst',
    'Compliance Officer', 'Auditor', 'Accountant', 'CPA', 'Tax Specialist',
    'Financial Planner', 'Wealth Manager', 'Insurance Agent', 'Underwriter',
    'Financial Controller', 'CFO', 'Finance Director', 'Treasury Manager',
    'Investment Analyst', 'Equity Research Analyst', 'Fixed Income Analyst',
    'Derivatives Trader', 'Risk Analyst', 'Compliance Manager', 'Internal Auditor',
    'External Auditor', 'Tax Manager', 'Financial Reporting Manager'
  ],
  
  // Creative & Design
  creative: [
    'Graphic Designer', 'UI Designer', 'UX Designer', 'Web Designer',
    'Product Designer', 'Industrial Designer', 'Fashion Designer', 'Interior Designer',
    'Architect', 'Landscape Architect', 'Art Director', 'Creative Director',
    'Copywriter', 'Content Writer', 'Technical Writer', 'Video Editor',
    'Photographer', 'Videographer', 'Animator', 'Illustrator',
    'Motion Graphics Designer', 'Brand Designer', 'Package Designer',
    'Exhibition Designer', 'Set Designer', 'Costume Designer', 'Game Designer',
    'User Experience Researcher', 'Design Manager', 'Creative Manager'
  ],
  
  // Legal & Compliance
  legal: [
    'Lawyer', 'Attorney', 'Paralegal', 'Legal Assistant', 'Legal Counsel',
    'Corporate Lawyer', 'Criminal Lawyer', 'Family Lawyer', 'Immigration Lawyer',
    'Patent Attorney', 'Trademark Attorney', 'Compliance Officer', 'Legal Analyst',
    'Judge', 'Magistrate', 'Court Reporter', 'Legal Secretary',
    'General Counsel', 'Associate Attorney', 'Senior Attorney', 'Partner',
    'Legal Director', 'Compliance Manager', 'Risk Manager', 'Legal Operations Manager',
    'Contract Manager', 'Intellectual Property Attorney', 'Employment Lawyer',
    'Real Estate Attorney', 'Tax Attorney', 'Estate Planning Attorney'
  ],
  
  // Operations & Logistics
  operations: [
    'Operations Manager', 'Supply Chain Manager', 'Logistics Coordinator',
    'Warehouse Manager', 'Inventory Manager', 'Procurement Specialist',
    'Operations Analyst', 'Process Improvement Specialist', 'Quality Manager',
    'Production Manager', 'Manufacturing Manager', 'Facilities Manager',
    'Supply Chain Analyst', 'Logistics Manager', 'Distribution Manager',
    'Operations Director', 'Plant Manager', 'Operations Research Analyst',
    'Continuous Improvement Manager', 'Lean Manager', 'Six Sigma Manager',
    'Vendor Manager', 'Sourcing Manager', 'Materials Manager'
  ],
  
  // Customer Service & Support
  customer_service: [
    'Customer Service Representative', 'Customer Success Manager', 'Account Manager',
    'Support Specialist', 'Help Desk Technician', 'Technical Support',
    'Customer Experience Manager', 'Client Relations Manager', 'Call Center Manager',
    'Customer Service Manager', 'Support Manager', 'Service Delivery Manager',
    'Client Success Manager', 'Customer Relations Manager', 'Service Manager',
    'Support Engineer', 'Technical Account Manager', 'Customer Advocate',
    'Service Coordinator', 'Client Services Manager', 'Customer Operations Manager'
  ],
  
  // Human Resources
  human_resources: [
    'HR Manager', 'HR Director', 'HR Specialist', 'HR Generalist',
    'Recruiter', 'Talent Acquisition Specialist', 'HR Business Partner',
    'Compensation Analyst', 'Benefits Specialist', 'Training Manager',
    'Employee Relations Manager', 'HR Coordinator', 'HR Assistant',
    'Talent Manager', 'People Operations Manager', 'HR Operations Manager',
    'Workforce Planning Manager', 'Organizational Development Manager',
    'HRIS Manager', 'Payroll Manager', 'HR Consultant'
  ],
  
  // Consulting & Professional Services
  consulting: [
    'Management Consultant', 'Business Consultant', 'Strategy Consultant',
    'Technology Consultant', 'Financial Consultant', 'HR Consultant',
    'Operations Consultant', 'Marketing Consultant', 'Sales Consultant',
    'IT Consultant', 'Security Consultant', 'Process Consultant',
    'Change Management Consultant', 'Project Consultant', 'Implementation Consultant',
    'Senior Consultant', 'Principal Consultant', 'Partner', 'Director'
  ]
};

/**
 * Extract job position with comprehensive profession recognition
 * Uses industry-specific job title database for maximum accuracy
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @return {string} Job position with profession classification
 */
function extractJobPositionWithProfession(htmlBody, subject) {
  console.log('Extracting job position with profession recognition');
  
  const htmlContent = htmlBody || '';
  const text = (subject + ' ' + htmlContent).toLowerCase();
  
  // 1. First try HTML structure parsing
  const htmlPosition = extractJobPositionFromHTML(htmlBody, subject);
  if (htmlPosition && htmlPosition !== 'Unknown Position') {
    const profession = classifyProfession(htmlPosition);
    if (profession) {
      console.log('Position found with profession:', htmlPosition, '->', profession);
      return htmlPosition + ' (' + profession + ')';
    }
  }
  
  // 2. Search through comprehensive job title database
  for (const [industry, titles] of Object.entries(JOB_TITLES_DATABASE)) {
    for (const title of titles) {
      if (text.includes(title.toLowerCase())) {
        console.log('Profession found:', title, '->', industry);
        return title + ' (' + industry + ')';
      }
    }
  }
  
  // 3. Partial matching for variations
  for (const [industry, titles] of Object.entries(JOB_TITLES_DATABASE)) {
    for (const title of titles) {
      const words = title.toLowerCase().split(' ');
      const matchedWords = words.filter(word => text.includes(word));
      
      if (matchedWords.length >= 2) { // At least 2 words match
        console.log('Partial profession match:', title, '->', industry);
        return title + ' (' + industry + ')';
      }
    }
  }
  
  // 4. Industry-specific pattern recognition
  const industryPattern = extractPositionWithIndustryContext(htmlBody, subject);
  if (industryPattern && industryPattern !== 'Unknown Position') {
    return industryPattern;
  }
  
  // 5. Fallback to original extraction
  return extractJobPositionFromHTML(htmlBody, subject);
}

/**
 * Classify profession based on job title
 * 
 * @param {string} jobTitle - Job title to classify
 * @return {string} Profession category
 */
function classifyProfession(jobTitle) {
  const title = jobTitle.toLowerCase();
  
  for (const [industry, titles] of Object.entries(JOB_TITLES_DATABASE)) {
    for (const dbTitle of titles) {
      if (title.includes(dbTitle.toLowerCase()) || dbTitle.toLowerCase().includes(title)) {
        return industry;
      }
    }
  }
  
  return null;
}

/**
 * Enhanced position extraction with industry context
 * Recognizes profession-specific patterns and terminology
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @return {string} Job position with industry context
 */
function extractPositionWithIndustryContext(htmlBody, subject) {
  const htmlContent = htmlBody || '';
  const text = (subject + ' ' + htmlContent).toLowerCase();
  
  // Industry-specific patterns
  const industryPatterns = {
    technology: [
      /software\s+(engineer|developer|architect)/i,
      /(frontend|backend|full.?stack)\s+developer/i,
      /(devops|cloud|security)\s+engineer/i,
      /(data|machine.?learning|ai)\s+engineer/i,
      /(mobile|ios|android)\s+developer/i,
      /(qa|test|quality)\s+engineer/i,
      /(systems|network|database)\s+engineer/i
    ],
    
    healthcare: [
      /(doctor|physician|nurse|dentist|pharmacist)/i,
      /(medical|clinical|healthcare)\s+(assistant|technician|specialist)/i,
      /(physical|occupational|speech)\s+therapist/i,
      /(surgeon|cardiologist|dermatologist|pediatrician)/i,
      /(registered\s+nurse|nurse\s+practitioner)/i,
      /(physician\s+assistant|medical\s+assistant)/i
    ],
    
    education: [
      /(teacher|professor|instructor|lecturer)/i,
      /(principal|dean|academic)\s+(advisor|coordinator)/i,
      /(education|curriculum|teaching)\s+(coordinator|specialist)/i,
      /(assistant|associate)\s+professor/i,
      /(special\s+education|esl)\s+teacher/i,
      /(school|counselor|academic\s+advisor)/i
    ],
    
    business: [
      /(manager|director|supervisor|lead)/i,
      /(project|product|program)\s+manager/i,
      /(business|operations|sales)\s+manager/i,
      /(general|regional|district)\s+manager/i,
      /(team\s+lead|operations\s+manager)/i,
      /(ceo|coo|cfo|cto|vp)/i
    ],
    
    sales_marketing: [
      /(sales|account)\s+(representative|executive|manager)/i,
      /(marketing|digital\s+marketing)\s+(specialist|manager)/i,
      /(business\s+development|customer\s+success)\s+manager/i,
      /(brand|product\s+marketing)\s+manager/i,
      /(seo|ppc|email\s+marketing)\s+specialist/i,
      /(content|social\s+media)\s+manager/i
    ],
    
    finance: [
      /(financial|investment|credit)\s+analyst/i,
      /(portfolio|wealth|financial)\s+manager/i,
      /(investment\s+banker|financial\s+advisor)/i,
      /(loan\s+officer|treasury\s+analyst)/i,
      /(compliance\s+officer|auditor|accountant)/i,
      /(cpa|tax\s+specialist|underwriter)/i
    ],
    
    creative: [
      /(graphic|ui|ux|web|product)\s+designer/i,
      /(art|creative)\s+director/i,
      /(copywriter|content\s+writer|technical\s+writer)/i,
      /(video\s+editor|photographer|videographer)/i,
      /(animator|illustrator|motion\s+graphics)/i,
      /(architect|interior\s+designer|fashion\s+designer)/i
    ],
    
    legal: [
      /(lawyer|attorney|paralegal|legal\s+counsel)/i,
      /(corporate|criminal|family|immigration)\s+lawyer/i,
      /(patent|trademark)\s+attorney/i,
      /(compliance\s+officer|legal\s+analyst)/i,
      /(judge|magistrate|court\s+reporter)/i,
      /(general\s+counsel|associate\s+attorney)/i
    ],
    
    operations: [
      /(operations|supply\s+chain|logistics)\s+manager/i,
      /(warehouse|inventory|procurement)\s+manager/i,
      /(production|manufacturing|facilities)\s+manager/i,
      /(quality|process\s+improvement)\s+manager/i,
      /(continuous\s+improvement|lean)\s+manager/i,
      /(vendor|sourcing|materials)\s+manager/i
    ],
    
    customer_service: [
      /(customer\s+service|support)\s+(representative|specialist)/i,
      /(customer\s+success|client\s+relations)\s+manager/i,
      /(help\s+desk|technical\s+support)/i,
      /(customer\s+experience|service\s+delivery)\s+manager/i,
      /(client\s+success|customer\s+advocate)/i,
      /(service\s+coordinator|operations)\s+manager/i
    ],
    
    human_resources: [
      /(hr|human\s+resources)\s+(manager|director|specialist)/i,
      /(recruiter|talent\s+acquisition)\s+specialist/i,
      /(hr\s+business\s+partner|compensation\s+analyst)/i,
      /(benefits\s+specialist|training\s+manager)/i,
      /(employee\s+relations|talent\s+manager)/i,
      /(people\s+operations|workforce\s+planning)/i
    ],
    
    consulting: [
      /(management|business|strategy)\s+consultant/i,
      /(technology|financial|hr)\s+consultant/i,
      /(operations|marketing|sales)\s+consultant/i,
      /(it|security|process)\s+consultant/i,
      /(change\s+management|project)\s+consultant/i,
      /(senior|principal)\s+consultant/i
    ]
  };
  
  // Check for industry-specific patterns
  for (const [industry, patterns] of Object.entries(industryPatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        console.log('Industry pattern found:', match[0], '->', industry);
        return match[0] + ' (' + industry + ')';
      }
    }
  }
  
  return null;
}

/**
 * Get profession statistics for analytics
 * 
 * @param {string} jobTitle - Job title to analyze
 * @return {Object} Profession statistics
 */
function getProfessionStatistics(jobTitle) {
  const profession = classifyProfession(jobTitle);
  
  if (!profession) {
    return {
      profession: 'Unknown',
      confidence: 0,
      industry: 'Unknown',
      category: 'Unknown'
    };
  }
  
  const industryCategories = {
    technology: 'STEM',
    data: 'STEM',
    healthcare: 'Healthcare',
    education: 'Education',
    business: 'Business',
    sales_marketing: 'Business',
    finance: 'Finance',
    creative: 'Creative',
    legal: 'Legal',
    operations: 'Operations',
    customer_service: 'Service',
    human_resources: 'Business',
    consulting: 'Professional Services'
  };
  
  return {
    profession: profession,
    confidence: 95,
    industry: profession,
    category: industryCategories[profession] || 'Other'
  };
}
