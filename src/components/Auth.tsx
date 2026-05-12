// ============================================================
// Auth.tsx - Đăng nhập / Đăng ký (Keycloak / Supabase Auth)
// Music Journey 2D | Giai đoạn 1: Placeholder Component
// (Sẽ được xây dựng đầy đủ ở Giai đoạn 4 - Tài khoản & Bảo mật)
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  accessToken: string;   // JWT Token để xác thực mọi request
  refreshToken: string;
}

export type AuthProvider = 'email' | 'google' | 'facebook';

/**
 * Placeholder: Đăng nhập bằng Email/Password
 * Giai đoạn 4: Tích hợp Supabase Auth / Keycloak
 */
export async function signIn(
  _email: string,
  _password: string
): Promise<AuthUser | null> {
  console.warn('[Auth] Placeholder - Chưa kết nối Supabase Auth.');
  console.warn('[Auth] Giai đoạn 4: Tích hợp supabase.auth.signInWithPassword()');
  return null;
}

/**
 * Placeholder: Đăng ký tài khoản mới
 */
export async function signUp(
  _email: string,
  _password: string,
  _username: string
): Promise<AuthUser | null> {
  console.warn('[Auth] Placeholder - Chưa kết nối Supabase Auth.');
  return null;
}

/**
 * Placeholder: Đăng nhập qua OAuth (Google / Facebook)
 * Giai đoạn 4: Tăng tỷ lệ chuyển đổi người dùng
 */
export async function signInWithOAuth(_provider: AuthProvider): Promise<void> {
  console.warn(`[Auth] OAuth (${_provider}) - Placeholder. Giai đoạn 4 sẽ triển khai.`);
}

/**
 * Placeholder: Đăng xuất
 */
export async function signOut(): Promise<void> {
  console.warn('[Auth] Placeholder - Chưa kết nối Supabase Auth.');
}

/**
 * Lấy trạng thái người dùng hiện tại từ localStorage (mock)
 */
export function getCurrentUser(): AuthUser | null {
  // Giai đoạn 4: Thay bằng supabase.auth.getSession()
  return null;
}
