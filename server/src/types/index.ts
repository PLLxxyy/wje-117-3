export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'coach' | 'admin';
  created_at: string;
}

export interface Plan {
  id: number;
  user_id: number;
  target_event: 'full' | 'half';
  target_time: number; // minutes
  current_level: 'beginner' | 'intermediate' | 'advanced';
  training_days: number;
  total_weeks: number;
  status: 'active' | 'completed';
  created_at: string;
}

export interface PlanDay {
  id: number;
  plan_id: number;
  week_number: number;
  day_number: number;
  workout_type: 'easy_run' | 'interval' | 'long_run' | 'tempo' | 'rest';
  target_distance_km: number;
  target_pace: string;
  description: string;
}

export interface Checkin {
  id: number;
  user_id: number;
  plan_id: number;
  plan_day_id: number;
  actual_distance_km: number;
  actual_duration_minutes: number;
  feeling: number; // 1-5
  notes: string;
  created_at: string;
}

export interface CoachStudent {
  id: number;
  coach_id: number;
  student_id: number;
  created_at: string;
}

export interface CoachNote {
  id: number;
  coach_id: number;
  student_id: number;
  plan_id: number;
  content: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  level: string;
  distance: string;
  weeks: number;
  description: string;
  created_by: number;
  created_at: string;
}

export interface Event {
  id: number;
  name: string;
  city: string;
  date: string;
  type: 'full' | 'half';
  created_at: string;
}

export interface PlanInput {
  target_event: 'full' | 'half';
  target_time: number;
  current_level: 'beginner' | 'intermediate' | 'advanced';
  training_days: number;
}

export interface GeneratedPlanDay {
  week_number: number;
  day_number: number;
  workout_type: 'easy_run' | 'interval' | 'long_run' | 'tempo' | 'rest';
  target_distance_km: number;
  target_pace: string;
  description: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
