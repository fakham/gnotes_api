// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";

require("dotenv").config();
const excel = require("./excel");
const xlsx = require("xlsx");

var loopback = require("loopback");
var boot = require("loopback-boot");

var app = (module.exports = loopback());

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit("started");
    var baseUrl = app.get("url").replace(/\/$/, "");
    console.log("Web server listening at: %s", baseUrl);
    if (app.get("loopback-component-explorer")) {
      var explorerPath = app.get("loopback-component-explorer").mountPath;
      console.log("Browse your REST API at %s%s", baseUrl, explorerPath);
    }
    // app.models.Score.destroyAll();
    // app.models.Student.destroyAll();
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) app.start();
});

app.models.Documents.afterRemote("upload", (ctx, doc, next) => {
  const fileName = doc.result.files.file[0].name;

  if (fileName.split(".").slice(-1)[0] == "xls") {
    console.log(fileName);
    const wb = xlsx.readFile("./assets/excels/" + fileName, {
      cellDates: true
    });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const subjectName = excel.getSubjectName(ws);
    const students = excel.getStudents(ws);
    const notesNumber = excel.getNotesNumber(ws);

    app.models.Subject.find({ where: { name: subjectName } }, (err, res) => {
      app.models.Excel.create(
        {
          name: fileName,
          subjectId: res[0].id,
          teacherId: res[0].teacherId
        },
        (err2, res2) => {
          if (!err2 && res2) console.log("Excel created!", res2);
          else console.log("There is an error!", err2);
        }
      );
      students.map(student => {
        app.models.Student.create(
          {
            code_apogee: student.codeApogee,
            first_name: student.prenom,
            last_name: student.nom,
            birth_date: student.dateNaissance
          },
          (err2, res2) => {
            if (!err2 && res2) {
              console.log("Student created!", res2);
              for (let i = 0; i < notesNumber; i++) {
                app.models.Score.create(
                  {
                    score: 0,
                    subjectId: res[0].id,
                    studentId: res2.id
                  },
                  (err3, res3) => {
                    if (!err3 && res3) console.log("Score created!", res3);
                    else console.log("There is an error!", err3);
                  }
                );
              }
            } else console.log("There is an error!", err2);
          }
        );
      });

      //console.log(res[0].teacherId);
    });
  } else {
    console.log("ERROR - Incorrect File Format!");
  }

  next();
});

function nextChar(c) {
  return String.fromCharCode(c.charCodeAt(0) + 1);
}

app.models.Documents.beforeRemote("download", (ctx, doc, next) => {
  console.log(ctx.req.params.file);
  const wb = xlsx.readFile("./assets/excels/" + ctx.req.params.file, {
    cellDates: true
  });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const students = excel.getStudents(ws);
  const nbr = excel.getStudents(ws).length;
  const notesNbr = excel.getNotesNumber(ws);

  app.models.Excel.find(
    { where: { name: ctx.req.params.file } },
    (err, res) => {
      let i = 36;
      students.map(student => {
        app.models.Student.find(
          { where: { code_apogee: student.codeApogee } },
          (err2, res2) => {
            app.models.Score.find(
              {
                where: {
                  studentId: res2[0].id,
                  subjectId: res[0].subjectId
                }
              },
              (err3, res3) => {
                let j = 0;
                let h = 0;
                let chr = "E";
                console.log("writing to sudent : " + student.codeApogee);
                while (j < notesNbr) {
                  while (h < res3.length) {
                    ws[chr + i] = { t: "n" };
                    ws[chr + i].v = res3[j].score;

                    chr = nextChar(chr);

                    ws[chr + i] = { t: "n" };
                    ws[chr + i].v = 20;

                    chr = nextChar(chr);

                    h++;
                    j++;
                  }

                  xlsx.writeFile(wb, "./assets/excels/" + ctx.req.params.file);
                  i++;

                  if (i - 36 === students.length) next();
                }
              }
            );
          }
        );
      });
    }
  );
});
