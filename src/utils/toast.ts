export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  duration?: number;
}

export function showToast(message: string, type: ToastType = 'info', options: ToastOptions = {}): void {
  const { duration = 4000 } = options;

  // 1. Get or create container
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  // 2. Create individual toast node
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  // 3. Status icons
  let iconHtml = '';
  if (type === 'success') {
    iconHtml = `
      <svg class="toast__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    `;
  } else if (type === 'error') {
    iconHtml = `
      <svg class="toast__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    `;
  } else {
    iconHtml = `
      <svg class="toast__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
  }

  toast.innerHTML = `
    ${iconHtml}
    <span class="toast__text">${message}</span>
    <button class="toast__close" aria-label="Dismiss notification" type="button">×</button>
  `;

  // 4. Append to container
  container.appendChild(toast);

  // 5. Dismiss handlers
  const dismiss = () => {
    if (toast.classList.contains('toast--dismissing')) return;
    toast.classList.add('toast--dismissing');
    
    // Wait for the exit animation to finish before removing from DOM
    toast.addEventListener('animationend', () => {
      toast.remove();
      // Clean up container if it's empty
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    }, { once: true });
  };

  // Close button click
  toast.querySelector('.toast__close')?.addEventListener('click', dismiss);

  // Auto-dismiss timer
  const autoDismissTimer = setTimeout(dismiss, duration);

  // Pause timer on hover, resume on leave
  let remainingTime = duration;
  let startTime = Date.now();
  let timerId = autoDismissTimer;

  toast.addEventListener('mouseenter', () => {
    clearTimeout(timerId);
    remainingTime -= Date.now() - startTime;
  });

  toast.addEventListener('mouseleave', () => {
    startTime = Date.now();
    timerId = setTimeout(dismiss, remainingTime);
  });
}
