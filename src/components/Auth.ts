// ============================================================
// Auth.tsx - Hệ thống Đăng nhập / Đăng ký (Giai đoạn 4)
// Music Journey 2D | Infinite Journey Auth UI
// ============================================================

import { supabase } from '../services/supabase';

export class AuthUI {
  private modal: HTMLDivElement | null = null;

  constructor() {
    this._injectStyles();
  }

  private _injectStyles() {
    if (document.getElementById('auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
      .auth-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
      }
      .auth-modal {
        background: #1a1a1a; border: 1px solid #333; border-radius: 16px;
        padding: 32px; width: 100%; max-width: 400px; color: white;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5); transform: translateY(20px);
        transition: transform 0.3s ease; font-family: 'Inter', sans-serif;
      }
      .auth-overlay.active { opacity: 1; }
      .auth-overlay.active .auth-modal { transform: translateY(0); }
      
      .auth-header { text-align: center; margin-bottom: 24px; }
      .auth-header h2 { margin: 0; font-size: 24px; color: #f9c74f; }
      .auth-header p { color: #888; font-size: 14px; margin-top: 8px; }
      
      .auth-form input {
        width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 8px;
        border: 1px solid #444; background: #000; color: white; outline: none;
        box-sizing: border-box; transition: border-color 0.2s;
      }
      .auth-form input:focus { border-color: #f9c74f; }
      
      .auth-btn {
        width: 100%; padding: 12px; border-radius: 8px; border: none;
        background: #f9c74f; color: #000; font-weight: bold; cursor: pointer;
        transition: transform 0.1s, background 0.2s; margin-top: 8px;
      }
      .auth-btn:hover { background: #f9b82f; }
      .auth-btn:active { transform: scale(0.98); }
      
      .auth-switch {
        text-align: center; margin-top: 16px; font-size: 13px; color: #aaa;
        cursor: pointer; text-decoration: underline;
      }
      .auth-error { color: #ff4d4d; font-size: 13px; margin-top: 8px; text-align: center; min-height: 20px; }
      .auth-close { position: absolute; top: 16px; right: 16px; color: #888; cursor: pointer; font-size: 20px; }
    `;
    document.head.appendChild(style);
  }

  show(isSignUp = false) {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'auth-overlay';
    this.modal.innerHTML = `
      <div class="auth-modal">
        <span class="auth-close">&times;</span>
        <div class="auth-header">
          <h2 id="auth-title">${isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
          <p id="auth-subtitle">${isSignUp ? 'Bắt đầu chuyến hành trình của bạn' : 'Chào mừng bạn quay trở lại'}</p>
        </div>
        <form class="auth-form" id="auth-form">
          <input type="email" id="auth-email" placeholder="Email" required />
          <input type="password" id="auth-password" placeholder="Mật khẩu" required minlength="6" />
          <button type="submit" class="auth-btn" id="auth-submit-btn">${isSignUp ? 'Đăng ký' : 'Đăng nhập'}</button>
        </form>
        <div class="auth-error" id="auth-error"></div>
        <div class="auth-switch" id="auth-switch">
          ${isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    setTimeout(() => this.modal?.classList.add('active'), 10);

    // Event listeners
    const form = this.modal.querySelector('#auth-form') as HTMLFormElement;
    const switchBtn = this.modal.querySelector('#auth-switch');
    const closeBtn = this.modal.querySelector('.auth-close');
    const errorEl = this.modal.querySelector('#auth-error') as HTMLDivElement;

    let mode = isSignUp ? 'signup' : 'signin';

    switchBtn?.addEventListener('click', () => {
      mode = mode === 'signin' ? 'signup' : 'signin';
      const title = this.modal?.querySelector('#auth-title');
      const sub = this.modal?.querySelector('#auth-subtitle');
      const btn = this.modal?.querySelector('#auth-submit-btn');
      if (title) title.textContent = mode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập';
      if (sub) sub.textContent = mode === 'signup' ? 'Bắt đầu chuyến hành trình của bạn' : 'Chào mừng bạn quay trở lại';
      if (btn) btn.textContent = mode === 'signup' ? 'Đăng ký' : 'Đăng nhập';
      if (switchBtn) switchBtn.textContent = mode === 'signup' ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay';
      errorEl.textContent = '';
    });

    closeBtn?.addEventListener('click', () => this.hide());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const email = (this.modal?.querySelector('#auth-email') as HTMLInputElement).value;
      const password = (this.modal?.querySelector('#auth-password') as HTMLInputElement).value;

      try {
        const btn = this.modal?.querySelector('#auth-submit-btn') as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        if (mode === 'signin') {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận (nếu có).');
        }
        
        this.hide();
        window.location.reload();
      } catch (err: any) {
        errorEl.textContent = err.message;
        const btn = this.modal?.querySelector('#auth-submit-btn') as HTMLButtonElement;
        btn.disabled = false;
        btn.textContent = mode === 'signup' ? 'Đăng ký' : 'Đăng nhập';
      }
    });
  }

  hide() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }
}

export const authUI = new AuthUI();
