const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const getParts = (iso: string) => {
  const parts = formatter.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
};

export const formatInquiryListDate = (iso: string): string => {
  const { month, day } = getParts(iso);
  return `${month}.${day}`;
};

export const formatInquiryDetailDate = (iso: string): string => {
  const { month, day, hour, minute } = getParts(iso);
  return `${month}.${day} ${hour}:${minute}`;
};
