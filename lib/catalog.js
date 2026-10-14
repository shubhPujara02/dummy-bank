// Shared vocabulary for Dummy Bank leads. The website, the seed generator and
// the form dropdowns all read from here so the values match.

const PRODUCTS = [
  { value: 'savings_account', label: 'Savings Account' },
  { value: 'salary_account', label: 'Salary Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'home_loan', label: 'Home Loan' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
];

const INCOME_BANDS = [
  { value: 'below_25k', label: 'Below ₹25,000 / month' },
  { value: '25k_50k', label: '₹25,000 – ₹50,000 / month' },
  { value: '50k_1l', label: '₹50,000 – ₹1,00,000 / month' },
  { value: '1l_2l', label: '₹1,00,000 – ₹2,00,000 / month' },
  { value: 'above_2l', label: 'Above ₹2,00,000 / month' },
];

const LEAD_CHANNELS = [
  { value: 'website_signup', label: 'Website – Account Signup' },
  { value: 'website_callback', label: 'Website – Callback Request' },
  { value: 'branch_walk_in', label: 'Branch Walk-in' },
  { value: 'call_center', label: 'Call Center' },
  { value: 'partner_referral', label: 'Partner Referral' },
  { value: 'paid_social', label: 'Paid Social Campaign' },
  { value: 'google_ads', label: 'Google Ads' },
];

const KYC_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending', label: 'Pending Documents' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'bn', label: 'Bengali' },
];

const isValid = (list, value) => list.some((o) => o.value === value);

module.exports = {
  PRODUCTS,
  INCOME_BANDS,
  LEAD_CHANNELS,
  KYC_STATUSES,
  LANGUAGES,
  isValid,
};
