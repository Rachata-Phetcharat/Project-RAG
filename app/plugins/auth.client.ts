// plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();

  // รันทุกครั้งที่ client โหลด (รวมถึงหลัง refresh)
  if (!auth.user && auth.token) {
    await auth.fetchUser();
  }
});
