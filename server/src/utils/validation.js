const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

// Returns today's date formatted as YYYY-MM-DD in the local timezone
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Validate reading inputs
const validateReadingInput = ({ reading_date, slot, value }) => {
  // 1. Missing or invalid date
  if (!reading_date || typeof reading_date !== 'string') {
    return {
      isValid: false,
      status: 400,
      message: 'Please enter a valid reading date.',
    };
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(reading_date)) {
    return {
      isValid: false,
      status: 400,
      message: 'Reading date must be in YYYY-MM-DD format.',
    };
  }

  // Validate parsed date validity (e.g. no February 31)
  const [year, month, day] = reading_date.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      isValid: false,
      status: 400,
      message: 'Please enter a valid calendar date.',
    };
  }

  // 5. Future date validation
  const today = getTodayDateString();
  if (reading_date > today) {
    return {
      isValid: false,
      status: 400,
      message: 'Date cannot be in the future.',
    };
  }

  // 6. Missing or invalid slot
  if (!slot || !VALID_SLOTS.includes(slot)) {
    return {
      isValid: false,
      status: 400,
      message:
        'Slot must be one of: Morning (fasting), After breakfast, After lunch, After dinner.',
    };
  }

  // 1. Missing value
  if (value === undefined || value === null || value === '') {
    return {
      isValid: false,
      status: 400,
      message: 'Please enter a glucose value.',
    };
  }

  // 2. Value not an integer or outside 40–600
  const numValue = Number(value);
  if (
    !Number.isInteger(numValue) ||
    typeof value === 'boolean' ||
    numValue < 40 ||
    numValue > 600
  ) {
    return {
      isValid: false,
      status: 400,
      message: 'Value must be a whole number between 40 and 600 mg/dl.',
    };
  }

  return {
    isValid: true,
    sanitized: {
      reading_date,
      slot,
      value: numValue,
    },
  };
};

module.exports = {
  VALID_SLOTS,
  getTodayDateString,
  validateReadingInput,
};
