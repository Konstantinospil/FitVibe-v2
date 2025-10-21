export const toPoints = ({
  calories,
  subjectiveDay,
}: {
  calories?: number;
  subjectiveDay?: number;
}) => Math.round((Number(calories || 0) * 0.1 + Number(subjectiveDay || 5) * 2) * 10) / 10;
