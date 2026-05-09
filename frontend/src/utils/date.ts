export const formatDueDateForDisplay = (dueDate: string) => {
  const match = dueDate.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);

  if (!match) {
    return dueDate;
  }

  return `${match[1]} ${match[2]}`;
};

export const getDueDateKey = (dueDate: string) => {
  const match = dueDate.match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : null;
};

export const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

export const getDateKey = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");

  return `${getMonthKey(date)}-${day}`;
};

export const getMonthTitle = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};
