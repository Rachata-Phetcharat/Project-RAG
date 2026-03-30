<template>
    <div class="chat-layout">
        <UToaster />
        <main class="chat-main">
            <slot />
        </main>
    </div>
</template>

<style scoped>
/* 
  ใช้ 100dvh แทน 100vh / h-screen
  dvh = Dynamic Viewport Height = คำนวณหลัง browser chrome (address bar) หดตัวแล้ว
  รองรับ iOS Safari, Android Chrome ที่ address bar เปลี่ยนขนาดได้
*/
.chat-layout {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100dvh;
}

.chat-main {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
}
</style>