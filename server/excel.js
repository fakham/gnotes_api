const xlsx = require("xlsx");

const getSubjectName = ws =>
  ws["B6"].v
    .split("\\")
    .slice(-1)[0]
    .split(".")[0];

const getStudents = ws => {
  const students = [];
  const data = xlsx.utils.sheet_to_json(ws).slice(31);

  data.map(item => {
    let date = item.__EMPTY_2;
    if (typeof date.getMonth !== "function") {
      const dateString = date;

      const dateParts = dateString.split("/");

      date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
    }

    const student = {
      codeApogee: item["XX-APO_TITRES-XX"],
      nom: item.__EMPTY,
      prenom: item.__EMPTY_1,
      dateNaissance: date
    };

    students.push(student);
  });

  return students;
};

const getNotesNumber = ws => {
  let count = 0;

  if (ws["E35"]) count++;
  if (ws["G35"]) count++;
  if (ws["I35"]) count++;
  if (ws["K35"]) count++;

  return count;
};

module.exports.getSubjectName = getSubjectName;
module.exports.getStudents = getStudents;
module.exports.getNotesNumber = getNotesNumber;
