import toast from 'react-hot-toast';

/**
 * Handle API errors gracefully
 * - Don't show errors for empty data (empty arrays, 404)
 * - Only show errors for actual server failures (5xx)
 * - Log errors for debugging
 */
export function handleApiError(error: any, customMessage?: string) {
    console.error('API Error:', error);

    // Check if it's an axios error with response
    if (error.response) {
        const status = error.response.status;

        // Server errors (500+)
        if (status >= 500) {
            toast.error(customMessage || 'خطأ في الخادم. يرجى المحاولة لاحقاً. | Server error. Please try again later.');
            return;
        }

        // Authentication errors
        if (status === 401) {
            // Don't show toast for 401 - axios interceptor handles it
            return;
        }

        // Forbidden
        if (status === 403) {
            toast.error('غير مصرح لك بهذا الإجراء | You are not authorized for this action');
            return;
        }

        // Not found - this is OK, just means no data
        if (status === 404) {
            // Don't show error for 404
            return;
        }

        // Bad request with message
        if (status === 400 && error.response.data?.message) {
            toast.error(error.response.data.message);
            return;
        }
    }

    // Network error or other issues (only if not 404-related)
    if (error.message && !error.message.includes('404')) {
        toast.error(customMessage || 'خطأ في الاتصال. يرجى التحقق من الإنترنت | Connection error. Please check your internet');
    }
}

/**
 * Safe API call wrapper
 * Returns empty array/null on error instead of throwing
 */
export async function safeApiCall<T>(
    apiCall: () => Promise<T>,
    defaultValue: T,
    showError = false
): Promise<T> {
    try {
        return await apiCall();
    } catch (error) {
        if (showError) {
            handleApiError(error);
        }
        return defaultValue;
    }
}
