const moment = require("moment");
const mongoose = require("mongoose");
const { async } = require("q");

const TimeSliceSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.ObjectId, ref: "Transporter", require: true },
    startDate: { type: Date, require: true },
    startTime: { type: String, require: true },
    endTime: { type: String, require: true },
    once: {
      endDate: Date,
    },
    daily: {
      everyDay: Boolean,
      everyWeekDay: Boolean,

      noEndDate: Boolean,
      endDateAfterOccurrence: Boolean,
      totalNoOfOccurrences: Number,

      noOfOccurrences: Number,
      repeatDays: Number, // disable, if every week days
      repeatWeeks: Number, // disable, if every days
      endDate: Date,
    },
    weekly: {
      noEndDate: Boolean,
      endDateAfterOccurrence: Boolean,
      totalNoOfOccurrences: Number,
      noOfOccurrences: Number,
      repeatWeek: Number,
      endDate: Date,
      days: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
    },
    monthly: {
      singleDayOfEveryMonth: Boolean,
      totalNoOfOccurrences: Number,
      noOfOccurrences: Number,
      singleOrMultipleDaysInEveryMonth: Boolean,
      noEndDate: Boolean,

      endDateAfterOccurrence: Boolean,
      endDate: Date,

      single: {
        repeat: Number,
        month: Number,
      },
      singleOrMultiple: {
        repeatOption: {
          type: String,
          enum: ["first", "second", "third", "fourth", "last"],
        },
        label: {
          type: String,
          enum: [
            "day",
            "weekday",
            "weekend",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        month: Number,
      },
    },
  },
  { timestamps: true }
);

TimeSliceSchema.statics.findById = function (id) {
  let days = 24 * 60 * 60 * 1000 * 3;
  // console.log(days);
  return this.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(id) },
    },
    {
      $addFields: {
        days_diff: {
          $cond: [
            { $ne: ["$daily.endDate", null] },
            {
              $divide: [
                { $subtract: ["$daily.endDate", "$startDate"] },
                86400000,
              ],
            },
            {
              $divide: [
                { $subtract: ["$daily.endDate", "$startDate"] },
                86400000,
              ],
            },
          ],
          // $divide: [{ $subtract: ["$once.endDate", "$startDate"] }, 86400000],
        },
      },
    },
    {
      $project: {
        datesArray: {
          $map: {
            input: { $range: [0, { $add: ["$days_diff", 1] }] },
            as: "dd",
            in: { $add: ["$startDate", { $multiply: ["$$dd", days] }] },
          },
        },
      },
    },
  ]);
};

TimeSliceSchema.statics.pwaTimeSlot = async function (transporter = null) {
  let query = {};
  if (!transporter) {
    query = {};
  } else {
    query = { transporter: transporter };
  }

  let datesArray = await this.find(query);

  let weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  let weekend = ["Sat", "Sun"];

  let mainArray = [];
 
  for (let i = 0; i < datesArray.length; i++) {
    const item = datesArray[i];
    if (item?.once) {
      mainArray.push({
        date: new Date(item?.once?.endDate),
        startTime: item?.startTime,
        endTime: item?.endTime,
      });
    }
    // Start------------- Daily ----------------------------------
    if (item?.daily) {
      let startDate = new Date(item?.startDate);
      let SDate = new Date(item?.startDate);
      let endDate = "";
      endDate = item?.daily?.endDate;
      if (!endDate) {
        endDate =
          item?.daily?.noEndDate && item?.daily?.totalNoOfOccurrences < 1
            ? new Date(SDate.setDate(SDate.getDate() + 90))
            : new Date(
                SDate.setDate(
                  SDate.getDate() + item?.daily?.totalNoOfOccurrences
                )
              );
      }
      if (item?.daily?.everyDay) {
        for (
          let k = startDate;
          k <= endDate;
          k.setDate(k.getDate() + item?.daily?.repeatDays)
        ) {
          mainArray.push({
            date: new Date(k),
            startTime: item?.startTime,
            endTime: item?.endTime,
          });
        }
      }
      if (item?.daily?.everyWeekDay) {
        for (let k = startDate; k <= endDate; k.setDate(k.getDate() + 1)) {
          let day = new Date(k).getDay();
          if (day > 0 && day < 6) {
            mainArray.push({
              date: new Date(k),
              startTime: item?.startTime,
              endTime: item?.endTime,
            });
          } else {
            endDate.setDate(endDate.getDate() + 1);
          }
        }
      }
    }
    // End------------- Daily ----------------------------------
    // Start------------- Weekly ----------------------------------
    if (item?.weekly?.days.length) {
      let startDate = new Date(item?.startDate);
      let SDate = new Date(item?.startDate);
      let endDate = "";
      endDate = item?.weekly?.endDate;
      if (!endDate) {
        endDate =
          item?.weekly?.noEndDate && item?.weekly?.totalNoOfOccurrences < 1
            ? new Date(SDate.setDate(SDate.getDate() + 90))
            : new Date(
                SDate.setDate(
                  SDate.getDate() + item?.weekly?.totalNoOfOccurrences
                )
              );
      }
      for (
        let i = startDate;
        i <= endDate;
        i.setDate(i.getDate() + item?.weekly?.repeatWeek)
      ) {
        for (let j = 0; j < item?.weekly?.days.length; j++) {
          if (
            new Date(i)
              .toLocaleString("en-us", { weekday: "long" })
              .toLowerCase() === item?.weekly?.days[j]
          ) {
            mainArray.push({
              date: new Date(i),
              startTime: item?.startTime,
              endTime: item?.endTime,
            });
          }
        }
      }
    }
    // End------------- Weekly ----------------------------------
    // Start------------- Monthly ----------------------------------
    if (item?.monthly) {
      let startDate = new Date(item?.startDate);
      let SDate = new Date(item?.startDate);
      let endDate = "";

      if (item?.monthly.totalNoOfOccurrences > 0) {
        endDate =
          item?.monthly.noEndDate === true
            ? new Date(
                sDate.setDate(
                  sDate.getDate() + item?.monthly.totalNoOfOccurrences
                )
              )
            : item?.monthly.endDate;
      } else {
        endDate =
          item?.monthly.noEndDate === true
            ? new Date(SDate.setDate(SDate.getDate() + 90))
            : item?.monthly.endDate;
      }

      for (
        let i = startDate;
        i <= endDate;
        i.setDate(i.getDate() + item?.monthly.singleOrMultiple.month)
      ) {
        if (item?.monthly.singleOrMultiple.label === "weekend") {
          for (let j = 0; j < weekend.length; j++) {
            if (
              new Date(i).toLocaleString("en-us", { weekday: "short" }) ===
              weekend[j]
            ) {
              mainArray.push({
                date: new Date(i),
                startTime: item?.startTime,
                endTime: item?.endTime,
              });
            }
          }
        }
        if (item?.monthly.singleOrMultiple.label === "weekdays") {
          for (let j = 0; j < weekDays.length; j++) {
            if (
              new Date(i).toLocaleString("en-us", { weekday: "short" }) ===
              weekDays[j]
            ) {
              mainArray.push({
                date: new Date(i),
                startTime: item?.startTime,
                endTime: item?.endTime,
              });
            }
          }
        }
      }
    }
    // End------------- Monthly ----------------------------------
  }
  return [...new Set(mainArray)];
};

TimeSliceSchema.statics.showTimeslots = async function (transporter) {
  let myTimeSlots = await this.find({ transporter: transporter });

  let date = new Date("2021-06-09");

  let days = [
    { id: 0, day: "sunday" },
    { id: 1, day: "monday" },
    { id: 2, day: "tuesday" },
    { id: 3, day: "wednesday" },
    { id: 4, day: "thursday" },
    { id: 5, day: "friday" },
    { id: 6, day: "saturday" },
  ];
  let day = new Date(date).getDay();
  let selectedDate = new Date(date).getDate();
  let selectedMonth = new Date(date).getMonth() + 1;

  let showTimeslots = myTimeSlots.filter((item) => {
    let dateStringMili = new Date(date).getTime();
    let startDateMili = new Date(
      moment(item?.startDate).format("YYYY-MM-DD")
    ).getTime();
    let startDateMonth =
      new Date(moment(item?.startDate).format("YYYY-MM-DD")).getMonth() + 1;

    if (
      moment(item?.once?.endDate).format("YYYY-MM-DD") >=
      moment(date).format("YYYY-MM-DD")
    ) {
      return item;
    }
    // start daily ---------------------------------------------------------------------

    if (
      item?.daily &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.everyDay === true &&
      item?.daily?.noEndDate == true &&
      ((dateStringMili - startDateMili) / 86400000) %
        item?.daily?.repeatDays ===
        0
    ) {
      return item;
    }
    if (
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.endDateAfterOccurrence === true &&
      item?.daily?.everyDay === true &&
      item?.daily?.noOfOccurrences < item?.daily?.totalNoOfOccurrences &&
      ((dateStringMili - startDateMili) / 86400000) %
        item?.daily?.repeatDays ===
        0
    ) {
      return item;
    }
    if (
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.endDate &&
      item?.daily?.everyDay === true &&
      moment(item?.daily?.endDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      ((dateStringMili - startDateMili) / 86400000) %
        item?.daily?.repeatDays ===
        0
    ) {
      return item;
    }
    if (
      item?.daily &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.everyWeekDay === true &&
      item?.daily?.noEndDate == true &&
      day > 0 &&
      day < 6
    ) {
      return item;
    }

    if (
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.endDateAfterOccurrence === true &&
      item?.daily?.everyWeekDay === true &&
      item?.daily?.noOfOccurrences < item?.daily?.totalNoOfOccurrences &&
      day > 0 &&
      day < 6
    ) {
      return item;
    }
    if (
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.daily?.everyDay === true &&
      moment(item?.daily?.endDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      day > 0 &&
      day < 6
    ) {
      return item;
    }
    // end daily ---------------------------------------------------------------------------------------
    if (
      item?.weekly?.days.length > 0 &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.weekly?.noEndDate == true &&
      Math.ceil((dateStringMili - startDateMili || 1) / 86400000 / 6) %
        item?.weekly?.repeatWeek ===
        1
    ) {
      let weelkyDays = [];
      days.map((day) =>
        item?.weekly?.days.map((day2) => {
          if (day.day === day2) {
            weelkyDays.push({ id: day.id, day: day.day });
          }
        })
      );

      let isDay = weelkyDays.some((weekDay) => weekDay.id === day);
      if (isDay) {
        return item;
      }
    }

    if (
      item?.weekly?.days.length > 0 &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.weekly?.endDateAfterOccurrence === true &&
      item?.weekly?.noOfOccurrences < item?.weekly?.totalNoOfOccurrences &&
      Math.ceil((dateStringMili - startDateMili || 1) / 86400000 / 6) %
        item?.weekly?.repeatWeek ===
        1
    ) {
      let weelkyDays = [];
      days.map((day) =>
        item?.weekly?.days.map((day2) => {
          if (day.day === day2) {
            weelkyDays.push({ id: day.id, day: day.day });
          }
        })
      );

      let isDay = weelkyDays.some((weekDay) => weekDay.id === day);
      if (isDay) {
        return item;
      }
    }

    if (
      item?.weekly?.days.length > 0 &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.weekly?.endDate &&
      moment(item?.weekly?.endDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      Math.ceil((dateStringMili - startDateMili || 1) / 86400000 / 6) %
        item?.weekly?.repeatWeek ===
        1
    ) {
      let weelkyDays = [];
      days.map((day) =>
        item?.weekly?.days.map((day2) => {
          if (day.day === day2) {
            weelkyDays.push({ id: day.id, day: day.day });
          }
        })
      );

      let isDay = weelkyDays.some((weekDay) => weekDay.id === day);

      if (isDay) {
        return item;
      }
    }

    if (
      item?.monthly?.single &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.monthly?.single?.repeat === selectedDate &&
      (selectedMonth - startDateMonth) % item?.monthly?.single?.month === 0 &&
      item?.monthly?.noEndDate == true
    ) {
      return item;
    }

    if (
      item?.monthly?.single &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.monthly?.single?.repeat === selectedDate &&
      (selectedMonth - startDateMonth) % item?.monthly?.single?.month === 0 &&
      item?.monthly?.endDateAfterOccurrence === true &&
      item?.monthly?.noOfOccurrences < item?.monthly?.totalNoOfOccurrences
    ) {
      return item;
    }

    if (
      item?.monthly?.single &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      item?.monthly?.single?.repeat === selectedDate &&
      (selectedMonth - startDateMonth) % item?.monthly?.single?.month === 0 &&
      item?.monthly?.endDate &&
      moment(item?.monthly?.endDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD")
    ) {
      return item;
    }

    if (
      item?.monthly?.singleOrMultiple &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      (selectedMonth - startDateMonth) %
        item?.monthly?.singleOrMultiple?.month ===
        0 &&
      item?.monthly?.noEndDate == true
    ) {
      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "day"
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        if (selectedDate === lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate < 8 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        day > 0 &&
        day < 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate < 8 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        (day === 0 || day === 6)
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate < 8 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        day === 1
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate < 8 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        day === 2
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate < 8 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        day === 3
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate < 8 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        day === 4
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate < 8 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        day === 5
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate < 8 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        day === 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate < 8 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        day === 0
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }
    }

    if (
      item?.monthly?.singleOrMultiple &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      (selectedMonth - startDateMonth) %
        item?.monthly?.singleOrMultiple?.month ===
        0 &&
      item?.monthly?.endDateAfterOccurrence === true &&
      item?.monthly?.noOfOccurrences < item?.monthly?.totalNoOfOccurrences
    ) {
      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "day"
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        if (selectedDate === lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate < 8 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        day > 0 &&
        day < 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate < 8 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        (day === 0 || day === 6)
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate < 8 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        day === 1
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate < 8 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        day === 2
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate < 8 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        day === 3
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate < 8 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        day === 4
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate < 8 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        day === 5
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate < 8 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        day === 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate < 8 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        day === 0
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }
    }

    if (
      item?.monthly?.singleOrMultiple &&
      moment(item?.startDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD") &&
      (selectedMonth - startDateMonth) %
        item?.monthly?.singleOrMultiple?.month ===
        0 &&
      moment(item?.monthly?.endDate).format("YYYY-MM-DD") <=
        moment(date).format("YYYY-MM-DD")
    ) {
      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "day" &&
        selectedDate === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "day"
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        if (selectedDate === lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate < 8 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day > 0 &&
        day < 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekday" &&
        day > 0 &&
        day < 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate < 8 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        (day === 0 || day === 6)
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "weekendday" &&
        (day === 0 || day === 6)
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate < 8 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 1
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "monday" &&
        day === 1
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate < 8 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 2
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "tuesday" &&
        day === 2
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate < 8 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 3
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "wednesday" &&
        day === 3
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate < 8 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 4
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "thursday" &&
        day === 4
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate < 8 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 5
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "friday" &&
        day === 5
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate < 8 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 6
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "saturday" &&
        day === 6
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "first" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate < 8 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "second" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 7 &&
        selectedDate < 15 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "third" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 14 &&
        selectedDate < 22 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "fourth" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        selectedDate > 21 &&
        selectedDate < 29 &&
        day === 0
      ) {
        return item;
      }

      if (
        item?.monthly?.singleOrMultiple?.repeatOption === "last" &&
        item?.monthly?.singleOrMultiple?.label === "sunday" &&
        day === 0
      ) {
        let lastDate = new Date(date);
        lastDate.setDate(0);

        let stD = new Date(lastDate);
        stD.setDate(lastDate.getDate() - 7);

        if (selectedDate > stD && selectedDate < lastDate.getDate()) {
          return item;
        }
      }
    }
  });
  // console.log(showTimeslots);
  return showTimeslots;
};

TimeSliceSchema.statics.fullDate = function () {
  let ddate = new Date();
  let yyyy = ddate.getFullYear();
  let mm = (ddate.getMonth() + 1).toString();
  mm = mm.length === 1 ? `0${mm}` : mm;
  let dd = ddate.getDate().toString();
  dd = dd.length === 1 ? `0${dd}` : dd;
  return new Date(`${yyyy}-${mm}-${dd}`);
};

module.exports = mongoose.model("TimeSlice", TimeSliceSchema);
