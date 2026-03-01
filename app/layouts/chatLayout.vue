<template>
    <div class="fixed inset-0 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
        <UToaster />
        <main class="flex-1 relative overflow-hidden">
            <slot />
        </main>
    </div>
</template>

<style scoped>
/* ป้องกันการ scroll ของ body หลัก เพื่อให้ sidebar และ chat แยกกัน scroll ได้ */
:deep(body) {
    overflow: hidden;
}
</style>