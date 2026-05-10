import axiosInstance from './axiosInstance';

/**
 * Extract a human-readable message from an Axios error.
 * Checks server response body first, then falls back to the network message.
 */
const extractError = (err) => {
  // Server returned a JSON error body
  const serverMsg = err.response?.data?.message;
  if (serverMsg) return serverMsg;

  // Validation errors array from express-validator
  const validationErrors = err.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((e) => e.message).join('. ');
  }

  // Network-level error (no response at all = CORS / server down)
  if (!err.response) {
    return 'Server se connection nahi ho saka. Backend chal raha hai? (localhost:5000)';
  }

  return err.message || 'Kuch ghalat ho gaya. Dobara koshish karo.';
};

/**
 * Register a new user.
 * Backend route: POST /api/auth/signup
 * Required fields: name, email, phone, password
 */
export async function registerUser({ name, email, phone, password }) {
  try {
    const { data } = await axiosInstance.post('/auth/signup', {
      name,
      email,
      phone,
      password,
    });
    return data; // { success, token, user }
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Login an existing user.
 * Backend route: POST /api/auth/login
 * Required fields: email, password
 */
export async function loginUser({ email, password }) {
  try {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    return data; // { success, token, user }
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Fetch the currently logged-in user's profile.
 * Backend route: GET /api/auth/me  (requires Bearer token)
 */
export async function fetchMe() {
  try {
    const { data } = await axiosInstance.get('/auth/me');
    return data; // { success, user }
  } catch (err) {
    throw new Error(extractError(err));
  }
}
