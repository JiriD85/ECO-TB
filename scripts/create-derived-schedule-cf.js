#!/usr/bin/env node
/**
 * Script to create the "derived_schedule" Calculated Field
 *
 * Output Keys: schedule_violation
 *
 * Usage: node scripts/create-derived-schedule-cf.js
 */

require('dotenv').config();
const { ThingsBoardApi } = require('../sync/api.js');

const ASSET_PROFILE_ID = 'fe06fd60-5a4c-11ef-9653-5b043856d68a'; // Measurement

const api = new ThingsBoardApi({
  baseUrl: process.env.TB_BASE_URL,
  username: process.env.TB_USERNAME,
  password: process.env.TB_PASSWORD,
});

async function createDerivedScheduleCF() {
  // TBEL Code for derived_schedule
  const tbelCode = `// Guard: Need is_on and schedule
if (is_on == null || weeklySchedule == null || weeklySchedule == "") {
  return {};
}

var schedule = JSON.parse(weeklySchedule);
if (schedule == null) {
  return {};
}

// Timezone offset in minutes (default: 60 = CET)
var tzOffset = 60;
if (schedule["timezoneOffset"] != null) {
  tzOffset = toInt(schedule["timezoneOffset"]);
}

// Get timestamp from context
var ts = ctx.latestTs;

// === European DST Detection (CET/CEST) ===
var msPerDay = 86400000;
var daysSince1970 = toInt(ts / msPerDay);
var year = 1970;
var days = daysSince1970;

// Approximate year calculation
while (days >= 365) {
  var daysInYear = 365;
  if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
    daysInYear = 366;
  }
  if (days >= daysInYear) {
    days = days - daysInYear;
    year = year + 1;
  } else {
    break;
  }
}

// Get month (simplified)
var daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
  daysInMonths[1] = 29;
}
var month = 0;
while (month < 12 && days >= daysInMonths[month]) {
  days = days - daysInMonths[month];
  month = month + 1;
}
month = month + 1;  // 1-based
var dayOfMonth = days + 1;

// DST: April-September = always DST, March/October = check last Sunday
var isDST = false;
if (month >= 4 && month <= 9) {
  isDST = true;
} else if (month == 3 && dayOfMonth >= 25) {
  // Last week of March - simplified: assume DST after 25th
  isDST = true;
} else if (month == 10 && dayOfMonth < 25) {
  // Before last week of October
  isDST = true;
}

// Apply DST correction
var effectiveOffset = tzOffset;
if (isDST) { effectiveOffset = tzOffset + 60; }

// Convert to local time
var localTs = ts + effectiveOffset * 60000;

// Day of week (0=Sun, 1=Mon, ... 6=Sat)
var dayIndex = (toInt(localTs / msPerDay) + 4) % 7;

var dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
var dayName = dayNames[dayIndex];

// Current local time as minutes since midnight
var msInDay = localTs % msPerDay;
var currentMinutes = toInt(msInDay / 60000);

// Check schedule for today
var isWithinSchedule = false;
var todayValue = schedule[dayName];

if (todayValue != null) {
  var todayStr = "" + todayValue;

  if (todayStr == "true") {
    isWithinSchedule = true;
  } else if (todayStr == "false") {
    isWithinSchedule = false;
  } else {
    // Full format with start/end times
    var enabled = todayValue["enabled"];
    if (("" + enabled) == "true") {
      var startStr = todayValue["start"];
      var endStr = todayValue["end"];

      if (startStr != null && endStr != null) {
        var startH = toInt(parseLong(startStr.substring(0, 2)));
        var startM = toInt(parseLong(startStr.substring(3, 5)));
        var startMinutes = startH * 60 + startM;

        var endH = toInt(parseLong(endStr.substring(0, 2)));
        var endM = toInt(parseLong(endStr.substring(3, 5)));
        var endMinutes = endH * 60 + endM;

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          isWithinSchedule = true;
        }
      } else {
        isWithinSchedule = true;  // enabled but no times = always
      }
    }
  }
}

// Violation = running outside schedule
return {
  "schedule_violation": (is_on == true && !isWithinSchedule)
};`;

  // Build CF payload
  const cfPayload = {
    name: 'derived_schedule',
    type: 'SCRIPT',
    configurationVersion: 0,
    debugSettings: null,
    configuration: {
      type: 'SCRIPT',
      arguments: {
        // TS_LATEST argument (from derived_basic CF)
        is_on: {
          refEntityKey: {
            key: 'is_on',
            type: 'TS_LATEST'
          }
        },
        // ATTRIBUTE argument (SERVER_SCOPE)
        weeklySchedule: {
          refEntityKey: {
            key: 'weeklySchedule',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: 'null'
        }
      },
      expression: tbelCode,
      output: {
        type: 'TIME_SERIES'
      },
      useLatestTs: true
    },
    entityId: {
      entityType: 'ASSET_PROFILE',
      id: ASSET_PROFILE_ID
    }
  };

  console.log('\n=== Creating derived_schedule CF ===\n');
  console.log('Payload:');
  console.log(JSON.stringify(cfPayload, null, 2));

  const result = await api.request('POST', '/api/calculatedField', cfPayload);
  console.log('\n=== Result ===\n');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  try {
    await api.login();

    // Create the new CF
    const newCF = await createDerivedScheduleCF();

    console.log('\n========================================');
    console.log('SUCCESS! Created CF with ID:', newCF.id?.id || newCF.id);
    console.log('========================================\n');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
