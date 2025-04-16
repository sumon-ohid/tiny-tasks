'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { AuthProvider, useAuthContext } from '@/lib/auth';
import { useContentContext, type Feature } from '@/lib/content-provider';
// ... rest of the file stays the same 