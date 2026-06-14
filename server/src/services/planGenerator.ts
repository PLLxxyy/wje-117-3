import { PlanInput, GeneratedPlanDay } from '../types';

/**
 * 配速计算：根据目标成绩和赛事类型推算各训练配速
 * full = 42.195km, half = 21.0975km
 */
function calculatePaces(input: PlanInput) {
  const distanceKm = input.target_event === 'full' ? 42.195 : 21.0975;
  const targetPaceMinPerKm = input.target_time / distanceKm; // min/km

  return {
    easy: targetPaceMinPerKm * 1.2,          // 轻松跑比目标慢20%
    tempo: targetPaceMinPerKm * 1.02,         // 节奏跑接近目标配速
    interval: targetPaceMinPerKm * 0.88,      // 间歇跑比目标快12%
    longRun: targetPaceMinPerKm * 1.12,       // 长距离比目标慢12%
    recovery: targetPaceMinPerKm * 1.3,       // 恢复跑最慢
  };
}

function formatPace(minutesPerKm: number): string {
  const min = Math.floor(minutesPerKm);
  const sec = Math.round((minutesPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * 基础周跑量(km)，根据水平和赛事类型
 */
function baseWeeklyVolume(level: string, event: string): number {
  const base: Record<string, Record<string, number>> = {
    beginner: { half: 20, full: 25 },
    intermediate: { half: 30, full: 40 },
    advanced: { half: 40, full: 55 },
  };
  return base[level]?.[event] ?? 25;
}

/**
 * 生成12周训练计划
 */
export function generatePlan(input: PlanInput): GeneratedPlanDay[] {
  const days: GeneratedPlanDay[] = [];
  const paces = calculatePaces(input);
  const baseVolume = baseWeeklyVolume(input.current_level, input.target_event);
  const totalWeeks = 12;
  const trainDays = input.training_days;

  for (let week = 1; week <= totalWeeks; week++) {
    // 最后一周减量40%，恢复周减量20%
    let volumeMultiplier = 1 + (week - 1) * 0.08; // 每周递增8%
    if (week === totalWeeks) {
      volumeMultiplier *= 0.6; // taper week
    } else if (week % 4 === 0) {
      volumeMultiplier *= 0.8; // recovery week
    }

    const weeklyVolume = baseVolume * volumeMultiplier;

    // 分配各训练日的距离
    const schedule = buildWeekSchedule(week, trainDays, weeklyVolume, paces, input.current_level, input.target_event);

    for (const entry of schedule) {
      days.push(entry);
    }
  }

  return days;
}

interface PaceSet {
  easy: number;
  tempo: number;
  interval: number;
  longRun: number;
  recovery: number;
}

function buildWeekSchedule(
  week: number,
  trainDays: number,
  weeklyVolume: number,
  paces: PaceSet,
  level: string,
  event: string,
): GeneratedPlanDay[] {
  const result: GeneratedPlanDay[] = [];
  const totalSlots = 7; // Monday to Sunday

  // Long run distance = roughly 25-30% of weekly volume
  const longRunDist = Math.round(weeklyVolume * 0.28 * 10) / 10;
  // Easy run accounts for remaining, split among easy days
  // Interval and tempo are quality sessions

  // Decide which days are training days
  // Convention: day 1=Mon ... 7=Sun
  // Long run on Saturday (day 6), interval mid-week, tempo another day
  let trainingDayNumbers: number[] = [];

  if (trainDays >= 6) {
    trainingDayNumbers = [1, 2, 3, 4, 5, 6];
  } else if (trainDays === 5) {
    trainingDayNumbers = [1, 2, 3, 5, 6];
  } else if (trainDays === 4) {
    trainingDayNumbers = [1, 3, 4, 6];
  } else {
    trainingDayNumbers = [1, 3, 6];
  }

  // Assign workout types
  // Long run always on day 6 (Saturday)
  // Interval on day 2 or 3
  // Tempo on day 4 or 5
  const qualityDays: Record<number, string> = {};
  qualityDays[6] = 'long_run';

  if (trainDays >= 4) {
    qualityDays[2] = 'interval';
    qualityDays[4] = 'tempo';
  } else if (trainDays === 3) {
    qualityDays[3] = 'interval';
  }

  const qualityCount = Object.keys(qualityDays).filter(d => qualityDays[Number(d)] !== 'long_run').length + 1;
  const easyDayCount = trainDays - qualityCount;
  const easyRunDist = easyDayCount > 0
    ? Math.round(((weeklyVolume - longRunDist) * 0.6 / easyDayCount) * 10) / 10
    : 0;
  const intervalDist = Math.round((weeklyVolume * 0.15) * 10) / 10;
  const tempoDist = Math.round((weeklyVolume * 0.2) * 10) / 10;

  for (let day = 1; day <= totalSlots; day++) {
    if (!trainingDayNumbers.includes(day)) {
      // Rest day
      result.push({
        week_number: week,
        day_number: day,
        workout_type: 'rest',
        target_distance_km: 0,
        target_pace: '',
        description: '休息日 - 恢复身体，可做拉伸或散步',
      });
      continue;
    }

    const workoutType = qualityDays[day] || 'easy_run';

    switch (workoutType) {
      case 'long_run':
        result.push({
          week_number: week,
          day_number: day,
          workout_type: 'long_run',
          target_distance_km: longRunDist,
          target_pace: formatPace(paces.longRun),
          description: `长距离跑 ${longRunDist}km - 配速${formatPace(paces.longRun)}/km，保持舒适节奏`,
        });
        break;
      case 'interval': {
        const reps = level === 'advanced' ? 8 : level === 'intermediate' ? 6 : 4;
        const repDist = event === 'full' ? 1.0 : 0.8;
        result.push({
          week_number: week,
          day_number: day,
          workout_type: 'interval',
          target_distance_km: intervalDist,
          target_pace: formatPace(paces.interval),
          description: `间歇跑 ${reps}x${repDist}km - 快跑配速${formatPace(paces.interval)}/km，间歇慢跑恢复`,
        });
        break;
      }
      case 'tempo':
        result.push({
          week_number: week,
          day_number: day,
          workout_type: 'tempo',
          target_distance_km: tempoDist,
          target_pace: formatPace(paces.tempo),
          description: `节奏跑 ${tempoDist}km - 配速${formatPace(paces.tempo)}/km，稳定匀速`,
        });
        break;
      default:
        result.push({
          week_number: week,
          day_number: day,
          workout_type: 'easy_run',
          target_distance_km: easyRunDist,
          target_pace: formatPace(paces.easy),
          description: `轻松跑 ${easyRunDist}km - 配速${formatPace(paces.easy)}/km，能边跑边聊天的节奏`,
        });
        break;
    }
  }

  return result;
}
