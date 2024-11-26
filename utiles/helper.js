function countWeekdaysBetweenDates(date1, date2) {
  const start = new Date(date1);
  const end = new Date(date2);
  let weekdaysCount = 0;

  // Loop through each day from start to end date
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdaysCount++; // Count the day if it's not Saturday or Sunday
    }
    // Move to the next day
    start.setDate(start.getDate() + 1);
  }

  return weekdaysCount;
}

function countDaysBetween(date1, date2) {
  const startDate = new Date(date1);
  const endDate = new Date(date2);

  // Calculate the time difference in milliseconds
  const timeDifference = endDate - startDate;

  // Convert time difference from milliseconds to days
  const days = timeDifference / (1000 * 60 * 60 * 24);
  const daysDifference = days + 1;

  return daysDifference;
}

function calculateProductPrice(
  productPrice,
  weekdays,
  totalDaysCount,
  days,
  daysInWeek,
  minimumRentalPeriod
) {
  const countDays = daysInWeek == 5 ? weekdays : totalDaysCount;
  const fullWeeks = Math.floor(countDays / daysInWeek);
  const remainingDays = countDays % daysInWeek;

  const totalPrice =
    countDays <= minimumRentalPeriod
      ? minimumRentalPeriod * productPrice
      : countDays * productPrice;

  return {
    fullWeeks,
    remainingDays,
    // remainingDaysPercentage,
    totalPrice,
  };
}

const percetageCalculate = (taxRate, price) => {
  let percentage = (taxRate / 100) * price;
  return percentage + price;
};

function getDueDate(daysToAdd) {
  let dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToAdd);
  return dueDate.toISOString().split("T")[0];
}

module.exports = {
  countWeekdaysBetweenDates,
  countDaysBetween,
  calculateProductPrice,
  percetageCalculate,
  getDueDate,
};
