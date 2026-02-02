<template>
    <div class="min-h-screen px-40">
        <nav class="flex items-center justify-between py-4">
            <NuxtLink to="/" class="text-xl">ระบบจัดการห้องสนทนา</NuxtLink>
            <div>
                <UserMenu />
            </div>
        </nav>

        <main>
            <slot />
        </main>
    </div>
</template>