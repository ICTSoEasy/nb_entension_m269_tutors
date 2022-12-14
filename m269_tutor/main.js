define([
    'base/js/namespace',
    'base/js/events'
    ], function(Jupyter, events) {
      var sticky_user_details = function() {
          cell = Jupyter.notebook.get_cell(0);
          inner_cell = cell.element.find('div.inner_cell');
          inner_cell.css("z-index","10");
          inner_cell.css("position","fixed");
          inner_cell.css("left","0px");
          inner_cell.css("top","100px");
          inner_cell.css("width","100%");
          inner_cell.css("background-color","#ffffcc");
      }
      var unsticky_user_details = function() {
          cell = Jupyter.notebook.get_cell(0);
          inner_cell = cell.element.find('div.inner_cell');
          inner_cell.removeAttr( 'style' );
      }
      var total_marks = function() {
          var idx = 0;
          var total_marks = 0;
          var max_marks = 0;
		  var last_question = 'Y';
		  var last_marks = 99;
          Jupyter.notebook.select(0);
          var missingMark = false;
		  var questionParts = [];
		  var duplicates = 'Duplicates: ';
		  var tbl = '<table><tr><td>Question</td><td>Marks</td><td>Out of</td></tr>';
          while (cell = Jupyter.notebook.get_cell(idx)) {
			  question = cell.metadata['QUESTION'] || false;
			  if (question) {
				  last_question = cell.metadata['QUESTION'];
			  }
              marks = cell.metadata['MARKS'] || 99;
              type = cell.metadata['TYPE'] || false;
              if (type == 'MARKS') {
                  if (marks != 99) {
                      max_marks += marks;
                      console.log(max_marks);
    				  last_marks = marks;
                  }
              }
              type = cell.metadata['TYPE'] || false;
              if (type == "MARKS") {
                  questionParts.push(cell.metadata['QUESTION'] || false);
                  target = cell.metadata['QUESTION'] || false;
                  counter = 0;
                  for (thing of questionParts) {
                      if (target == thing) {
                          counter++;
                      }
                  }
                  if (counter > 1) {
                      duplicates = duplicates + cell.metadata['QUESTION'] + ' ';
                  }
                  var mark = cell.get_text().split('/')[0];
                  var markf = parseFloat(mark);
                  if (!isNaN(markf)) {
                      total_marks += markf;
                  } else {
                      missingMark = true;
                  }
				  tbl += '<tr><td>';
				  if (mark == '?') {
					  tbl += '<MARK style="background-color:yellow">';
				  }
				  tbl += last_question;
				  if (mark == '?') {
					  tbl += '</MARK>';
				  }
				  tbl += '</td><td>'+mark+'</td><td>'+last_marks+'</td></tr>';
              }
              idx++;
          }
          if (missingMark) {
              alert('At least one mark is missing.');
          }
		  tbl += '</table><br /><br />'+'Total marks: '+Math.round(total_marks)+'/'+max_marks;
		  if (Jupyter.notebook.get_cell(-1).metadata['TYPE'] == "RESULTS") {
			  //Delete old results box
			  Jupyter.notebook.delete_cell(-1);
		  }
		  Jupyter.notebook.insert_cell_at_bottom('markdown').set_text(tbl+'<hr />'+duplicates);
		  //Jupyter.notebook.insert_cell_at_bottom('markdown').set_text('Total marks: '+total_marks+'/'+max_marks);
		  Jupyter.notebook.get_cell(-1).metadata['cellcol'] = 'feedbackcell';
		  Jupyter.notebook.get_cell(-1).metadata['TYPE'] = 'RESULTS';
		  Jupyter.notebook.get_cell(-1).execute();
		  Jupyter.notebook.get_cell(1).execute();

          /*const fs = require('fs')

          // Data which will write in a file.
          let data = "Learning how to write in a file."

          // Write data in 'Output.txt' .
          fs.writeFile('Output.txt', data, (err) => {

              // In case of a error throw err.
              if (err) throw err;
          })*/
		  Jupyter.notebook.save_notebook();
      };
      var unlock_cells = function() {
          var idx = 0;
          while (cell = Jupyter.notebook.get_cell(idx)) {
              if (cell.metadata['editable'] == false) {
                  cell.metadata['editable'] = true
              }
              idx++;
          }
          Jupyter.notebook.save_notebook();
          alert('unlocked');
      };
      var lock_cells = function() {
          var idx = 0;
          while (cell = Jupyter.notebook.get_cell(idx)) {
              if (cell.metadata['editable'] == true) {
                  cell.metadata['editable'] = false
              }
              idx++;
          }
          Jupyter.notebook.save_notebook();
          alert('locked');
      };      var prepare_for_marking = function() {
        //alert('start');
        var that = this;
        var current_dir = $('body').attr('data-notebook-path').split('/').slice(0, -1).join("/");
        current_dir = current_dir? current_dir + "/": "";
        var current_name = $('body').attr('data-notebook-name');
        var new_name = current_name.split('.').slice(0,-1).join('.');
		if (new_name.includes('-STUDENT')) {
			new_name = new_name.replace('-STUDENT','-MARKED');
			new_name = new_name + '.ipynb';
		} else {
			new_name = new_name + '-MARKED.ipynb';
		}
        nb_path = current_dir + new_name;
        nb_name = new_name;
        var model = {
            'type': 'notebook',
            'content': Jupyter.notebook.toJSON(),
            'name': nb_name
        };

        var feedback_contents = `<b>Feedback: </b><br /><br />Marks:`;
        var feedback_contents_no_marks = `<b>Feedback: </b><br /><br />`;


        isExecuted = confirm("This will overwrite any notebook already created for the marking of this file. Are you sure you want to continue?");
        if (isExecuted) {
            Jupyter.notebook.contents.save(decodeURI(nb_path), model)
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
            var no_marks = false;
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
                    if (no_marks == false) {
                        marks_cell_added = true;
                    } else {
                        no_marks = false;
                    }
                }
                type = cell.metadata['TYPE'] || false;
                marks = cell.metadata['MARKS'] || 99;
				question = cell.metadata['QUESTION'] || false;
                if (type == "ANSWER") {
                    if (marks != -1) {
                        Jupyter.notebook.insert_cell_below('markdown').set_text("?/"+marks);
    					Jupyter.notebook.get_cell(idx+1).metadata['MARKS'] = marks;
    					Jupyter.notebook.get_cell(idx+1).metadata['QUESTION'] = question;
                        Jupyter.notebook.insert_cell_below('markdown').set_text(feedback_contents);
                        feedback_cell_added = true;
                    } else {
                        Jupyter.notebook.insert_cell_below('markdown').set_text(feedback_contents_no_marks);
                        feedback_cell_added = true;
                        no_marks = true;
                    }
                }
                idx++;
                Jupyter.notebook.select_next();
            }
            Jupyter.notebook.delete_cell(1);
            Jupyter.notebook.delete_cell(1);
            Jupyter.notebook.get_cell(1).execute();
			Jupyter.notebook.save_notebook();
            alert('Prepared.');
        }

        //Jupyter.notebook.
        //insert_cell_above('code').
        //set_text(`# HELLO from Planet Jupyter!`);
        //Jupyter.notebook.select_prev();
        //Jupyter.notebook.execute_cell_and_select_below();
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
                  'icon' : 'fa-check',
                  'handler': total_marks
              }, 'total-marks', 'M269')
          ])
      }
      //Lock cells button
      var LockCells = function() {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register({
                  'help': 'Lock cells',
                  'icon' : 'fa-lock',
                  'handler': lock_cells
              }, 'lock-cells', 'M269')
          ])
      }
      //Unlock cells button
      var UnlockCells = function() {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register({
                  'help': 'Unlock cells',
                  'icon' : 'fa-unlock',
                  'handler': unlock_cells
              }, 'unlock-cells', 'M269')
          ])
      }
      //Stick user details to top
      var StickyUserDetails = function() {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register({
                  'help': 'Sticky User Details',
                  'icon' : 'fa-user-plus',
                  'handler': sticky_user_details
              }, 'sticky-user-details', 'M269')
          ])
      }
      //Unstick user details to top
      var UnStickyUserDetails = function() {
          Jupyter.toolbar.add_buttons_group([
              Jupyter.keyboard_manager.actions.register({
                  'help': 'Unsticky User Details',
                  'icon' : 'fa-user-times',
                  'handler': unsticky_user_details
              }, 'unsticky-user-details', 'M269')
          ])
      }



    // Run on start
    function load_ipython_extension() {
        PrepareForMarkingButton();
        TotalMarksButton();
        UnlockCells();
        LockCells();
        StickyUserDetails();
        UnStickyUserDetails();
    }
    return {
        load_ipython_extension: load_ipython_extension
    };
});

//jupyter contrib nbextension install --user
