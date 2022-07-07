define([
    'base/js/namespace',
    'base/js/events'
    ], function(Jupyter, events) {
      var total_marks = function() {
          var idx = 0;
          var total_marks = 0;
          var max_marks = 0;
          Jupyter.notebook.select(0);
          var missingMark = false;
          while (cell = Jupyter.notebook.get_cell(idx)) {
              marks = cell.metadata['MARKS'] || 99;
              if (marks != 99) {
                  max_marks += marks;
              }
              type = cell.metadata['TYPE'] || false;
              if (type == "MARKS") {
                  var mark = cell.get_text().split('/')[0];
                  var markf = parseFloat(mark);
                  if (!isNaN(markf)) {
                      total_marks += markf;
                  } else {
                      missingMark = true;
                  }
                  console.log(mark);
                  console.log(total_marks);
              }
              idx++;
          }
          if (missingMark) {
              alert('At least one mark is missing.');
          } else {
              Jupyter.notebook.insert_cell_at_bottom('markdown').set_text("Total marks: "+total_marks+"/"+max_marks);
              Jupyter.notebook.get_cell(-1).metadata['cellcol'] = 'feedbackcell';
              Jupyter.notebook.get_cell(-1).execute();
              Jupyter.notebook.get_cell(1).execute();
          }

          const fs = require('fs')

          // Data which will write in a file.
          let data = "Learning how to write in a file."

          // Write data in 'Output.txt' .
          fs.writeFile('Output.txt', data, (err) => {

              // In case of a error throw err.
              if (err) throw err;
          })

      };
      var prepare_for_marking = function() {
        //alert('start');
        var that = this;
        var current_dir = $('body').attr('data-notebook-path').split('/').slice(0, -1).join("/");
        current_dir = current_dir? current_dir + "/": "";
        var current_name = $('body').attr('data-notebook-name');
        var new_name = current_name.split('.').slice(0,-1).join('.');
        new_name = new_name + '-FEEDBACK.ipynb';
        nb_path = current_dir + new_name;
        nb_name = new_name;
        var model = {
            'type': 'notebook',
            'content': Jupyter.notebook.toJSON(),
            'name': nb_name
        };

        var feedback_contents = `<b>Feedback: </b><br /><br />Marks:`;

        isExecuted = confirm("This will overwrite any -FEEDBACK notebook already created for this file. Are you sure you want to continue?");
        if (isExecuted) {
            Jupyter.notebook.contents.save(nb_path, model)
                .then(function(data) {
                    Jupyter.notebook.notebook_name = data.name;
                    Jupyter.notebook.notebook_path = data.path;
                    Jupyter.notebook.session.rename_notebook(data.path);
                    Jupyter.notebook.events.trigger('notebook_renamed.Notebook', data);
                }, function(error) {
                    var msg = (error.message || 'Unknown error saving notebook');
                    alert(msg);
                });
            Jupyter.notebook._update_autosave_interval();
            var idx = 0;
            var feedback_cell_added = false;
            var marks_cell_added = false;
            Jupyter.notebook.select(0);
            while (cell = Jupyter.notebook.get_cell(idx)) {
                if (marks_cell_added) {
                    cell.metadata['cellcol'] = 'feedbackcell';
                    cell.metadata['TYPE'] = "MARKS";
                    cell.execute();
                    marks_cell_added = false;
                }
                if (feedback_cell_added) {
                    cell.metadata['cellcol'] = 'feedbackcell';
                    cell.execute();
                    feedback_cell_added = false;
                    marks_cell_added = true;
                }
                type = cell.metadata['TYPE'] || false;
                marks = cell.metadata['MARKS'] || 99;
                if (type == "ANSWER") {
                    Jupyter.notebook.insert_cell_below('markdown').set_text("?/"+marks);
                    Jupyter.notebook.insert_cell_below('markdown').set_text(feedback_contents);
                    feedback_cell_added = true;
                }
                idx++;
                Jupyter.notebook.select_next();
            }
            Jupyter.notebook.delete_cell(1);
            Jupyter.notebook.delete_cell(1);
            Jupyter.notebook.get_cell(1).execute();
        }

        //Jupyter.notebook.
        //insert_cell_above('code').
        //set_text(`# HELLO from Planet Jupyter!`);
        //Jupyter.notebook.select_prev();
        //Jupyter.notebook.execute_cell_and_select_below();
        alert('end');
      };
      // Add prep for marking button
      var PrepareForMarkingButton = function () {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register ({
                  'help': 'Prepare student notebook for marking',
                  'icon' : 'fa-play',
                  'handler': prepare_for_marking
              }, 'prep-for-marking', 'M269')
          ])
      }
      // Add total marks button
      var TotalMarksButton = function () {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register ({
                  'help': 'Total up marks',
                  'icon' : 'fa-play',
                  'handler': total_marks
              }, 'total-marks', 'M269')
          ])
      }



    // Run on start
    function load_ipython_extension() {
        // Add a default cell if there are no cells
        if (Jupyter.notebook.get_cells().length===1){
            //insert_cell();
        }
        PrepareForMarkingButton();
        TotalMarksButton();
    }
    return {
        load_ipython_extension: load_ipython_extension
    };
});

//jupyter contrib nbextension install