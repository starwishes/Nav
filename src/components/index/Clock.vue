<template>
  <div class="hs-clock">
    <div class="time">
      <span ref="hour" class="hour">{{ hours }}</span>
      <div class="text">时</div>
      <span ref="minute" class="minute">{{ minutes }}</span>
      <div class="text">分</div>
      <span ref="second" class="second">{{ seconds }}</span>
      <div class="text">秒</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')
const timezone = ref('')

const fetchTimezone = async () => {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    timezone.value = data.timezone || '';
  } catch (err) {
    console.error('获取时区设置失败', err);
  }
}

const clock = () => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  if (timezone.value) {
    options.timeZone = timezone.value;
  }

  const now = new Date();
  const timeStr = now.toLocaleString('en-GB', options); // 使用 en-GB 强制 24 小时格式
  const parts = timeStr.split(':');
  
  if (parts.length === 3) {
    hours.value = parts[0];
    minutes.value = parts[1];
    seconds.value = parts[2];
  }
}

onMounted(async () => {
  await fetchTimezone();
  clock();
  setInterval(clock, 1000);
})
</script>

<style lang="scss" scoped>
.hs-clock {
  // width: 100%;
  // height: 100%;
  .time {
    width: 140px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    span {
      display: inline-block;
      width: 25px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      font-weight: 500;
    }
    .text {
      font-size: 14px;
      margin: 0 4px;
    }
  }
}
</style>