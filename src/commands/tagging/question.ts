import { Message } from 'discord.js';
import { SageClient } from '@lib/types/SageClient';
import { Course } from '@lib/types/Course';
import { ROLES } from '@root/config';

export const description = 'Filters the questionTags collection for a given class and assignment';
export const usage = '<courseID>|<assignmentID>';
export const aliases = ['q'];

// never assume that students are not dumb
