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
