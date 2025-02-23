// @ts-check

const ERR = require('async-stacktrace');
const _ = require('lodash');
const async = require('async');
const path = require('path');
const jsonStringifySafe = require('json-stringify-safe');
const debug = require('debug')('prairielearn:' + path.basename(__filename, '.js'));
const ejs = require('ejs');
const moment = require('moment');
const fs = require('fs');
const unzipper = require('unzipper');
const fg = require('fast-glob');
<<<<<<< HEAD:lib/question.js

const markdown = require('./markdown');
const config = require('./config');
const csrf = require('./csrf');
=======
const util = require('util');
const { workspaceFastGlobDefaultOptions } = require('@prairielearn/workspace-utils');
const { EncodedData } = require('@prairielearn/browser-utils');

const { config, setLocalsFromConfig } = require('./config');
const { generateSignedToken } = require('@prairielearn/signed-token');
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
const externalGrader = require('./externalGrader');
const manualGrading = require('./manualGrading');
const ltiOutcomes = require('../lib/ltiOutcomes');
const sqldb = require('@prairielearn/postgres');
const questionServers = require('../question-servers');
const workspaceHelper = require('./workspace');
const issues = require('./issues');
const error = require('@prairielearn/error');
<<<<<<< HEAD:lib/question.js
const seedrandom = require('seedrandom') // might need to install packages (or copy the code with credit?)
=======
const { createServerJob } = require('./server-jobs');
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js

const sql = sqldb.loadSqlEquiv(__filename);

/**
 * To improve performance, we'll only render at most three submissions on page
 * load. If the user requests more, we'll render them on the fly.
 */
const MAX_RECENT_SUBMISSIONS = 3;

/**
 * Internal error type for tracking lack of submission.
 */
class NoSubmissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoSubmissionError';
  }
}

module.exports = {
  /**
   * Internal function, do not call directly. Write the courseIssues for a variant to the DB.
   * @protected
   *
   * @param {Array} courseIssues - List of issue objects for to be written.
   * @param {Object} variant - The variant associated with the issues.
   * @param {string} authn_user_id - The currently authenticated user.
   * @param {string} studentMessage - The message to display to the student.
   * @param {Object} courseData - Arbitrary data to be associated with the issues.
   * @param {function} callback - A callback(err) function.
   */
  _writeCourseIssues(courseIssues, variant, authn_user_id, studentMessage, courseData, callback) {
    async.eachSeries(
      courseIssues,
      async (courseErr) => {
        await issues.insertIssueForError(courseErr, {
          variantId: variant.id,
          studentMessage,
          courseData,
          authnUserId: authn_user_id,
        });
      },
      (err) => {
        if (ERR(err, callback)) return;
        callback(null);
      },
    );
  },

  //TODO: copy this function, call it _makeUniqueVariant, and modify it to add the extesnsion
  /**
   * Internal function, do not call directly. Create a variant object, do not write to DB.
   * @protected
   *
   * @param {Object} question - The question for the variant.
   * @param {Object} course - The course for the question.
   * @param {Object} options - Options controlling the creation: options = {variant_seed}
   * @param {function} callback - A callback(err, courseIssues, variant) function.
   */
  _makeVariant(question, course, options, callback) {
    debug('_makeVariant()');
    var variant_seed;
    if (_(options).has('variant_seed') && options.variant_seed != null) {
      variant_seed = options.variant_seed;
    } else {
      variant_seed = Math.floor(Math.random() * Math.pow(2, 32)).toString(36);
    }
    debug(`_makeVariant(): question_id = ${question.id}`);
    debug('test');
    questionServers.getModule(question.type, (err, questionModule) => {
      if (ERR(err, callback)) return;
      questionModule.generate(question, course, variant_seed, (err, courseIssues, data) => {
        if (ERR(err, callback)) return;
        const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
        var variant = {
          variant_seed: variant_seed,
          params: data.params || {},
          true_answer: data.true_answer || {},
          options: data.options || {},
          broken: hasFatalIssue,
        };
        if (question.workspace_image !== null) {
          // if workspace, add graded files to params
          variant.params['_workspace_required_file_names'] = (
            question.workspace_graded_files || []
          ).filter((file) => !fg.isDynamicPattern(file, workspaceHelper.fastGlobDefaultOptions));
          if (!('_required_file_names' in variant.params)) {
            variant.params['_required_file_names'] = [];
          }
          variant.params['_required_file_names'] = variant.params['_required_file_names'].concat(
            variant.params['_workspace_required_file_names'],
          );
        }
        if (variant.broken) {
          return callback(null, courseIssues, variant);
        }
        questionModule.prepare(question, course, variant, (err, extraCourseIssues, data) => {
          if (ERR(err, callback)) return;
          courseIssues.push(...extraCourseIssues);
          const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
          var variant = {
            variant_seed: variant_seed,
            params: data.params || {},
            true_answer: data.true_answer || {},
            options: data.options || {},
            broken: hasFatalIssue,
          };
          callback(null, courseIssues, variant);
        });
      });
    });
  },

  //TODO: copy this function, call it _makeUniqueVariant, and modify it to add the extesnsion
  /**
   * Internal function, do not call directly. Create a variant object, do not write to DB.
   * @protected
   *
   * @param {Object} question - The question for the variant.
   * @param {Object} course - The course for the variant.
   * @param {Object} options - Options controlling the creation: options = {variant_seed}
   * @param {function} callback - A callback(err, courseIssues, variant) function.
   */

  //   sqldb.call('variants_peek', [instance_question_id, question_id, course.id, user_id], (err, result) => {
  //     if (ERR(err, callback)) return;
  //     const new_number = result;
  //     debug('variants_peeked everything', new_number);
  // });
  _makeUniqueVariant(question, course, options, new_number, callback) {
    debug('_makeUniqueVariant()');
    var variant_seed;
    if (_(options).has('variant_seed') && options.variant_seed != null) {
      variant_seed = options.variant_seed;
    } else {
      variant_seed = Math.floor(Math.random() * Math.pow(2, 32)).toString(36);
    }
    debug(`_makeUniqueVariant(): question_id = ${question.id}`);
    questionServers.getModule(question.type, (err, questionModule) => {
      if (ERR(err, callback)) return;
      questionModule.generate(question, course, variant_seed, (err, courseIssues, data) => {
        if (ERR(err, callback)) return;
        assessment_instance.user_id
        debug('questionUserid', question.user_id);
        debug('questionAuthUserid', question.auth_user_id);
        debug('questionAuthnUserid', question.authn_user_id);
        debug('questionUser', question.user);
        debug('questionUserId', question.userid);
        fisheryates(question.auth_user_id, data, new_number, question.unique_variants_max); // unsure where user_id is and where to put this function
        debug('variantkey', data.variant_key);
        const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
        var variant = {
          variant_seed: variant_seed,
          params: data.params || {},
          true_answer: data.true_answer || {},
          options: data.options || {},
          broken: hasFatalIssue,
        };
        if (question.workspace_image !== null) {
          // if workspace, add graded files to params
          variant.params['_workspace_required_file_names'] = (
            question.workspace_graded_files || []
          ).filter((file) => !fg.isDynamicPattern(file, workspaceHelper.fastGlobDefaultOptions));
          if (!('_required_file_names' in variant.params)) {
            variant.params['_required_file_names'] = [];
          }
          variant.params['_required_file_names'] = variant.params['_required_file_names'].concat(
            variant.params['_workspace_required_file_names']
          );
        }
        if (variant.broken) {
          return callback(null, courseIssues, variant);
        }
        questionModule.prepare(question, course, variant, (err, extraCourseIssues, data) => {
          if (ERR(err, callback)) return;
          courseIssues.push(...extraCourseIssues);
          const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
          var variant = {
            variant_seed: variant_seed,
            params: data.params || {},
            true_answer: data.true_answer || {},
            options: data.options || {},
            broken: hasFatalIssue,
          };
          
          callback(null, courseIssues, variant);
        });
      });
    });
    //fisher yates 0-upperbound --> correspond to the question


    function fisheryates(userid, data, new_number, upperbound) { // how to access userid?
      const rng = seedrandom(userid) // set the random seed
      
      // fisher yates
    
      // var upperbound = question.uniqueVariantsOptions.max  // total number of variants

      var numbers = new Array(upperbound);
    
      // populate array with 0 ... upperbound - 1
      for (var i = 0; i < upperbound; i++) {
        numbers[i] = i;
      }
      debug('fisherYates zeros', numbers);
    
      
      for (i = upperbound - 1; i >= 0; i--)
      {
        const randomnumber = getRandomInt(0, upperbound - 1, rng);
    
    
        // swap
        var tmp = numbers[i];
        numbers[i] = numbers[randomnumber];
        numbers[randomnumber] = tmp;
      } // need to connect the array to the questions
      debug('fisherYates upperbound', upperbound);
      debug('fisherYates numbersarray', numbers);
      debug('fisherYates new_number', new_number);
      data.variant_key = numbers[new_number % (upperbound - 1)]; // how to access data and variantid, mod (upperbound - 1) just bandaid before double something
      debug('variantkeyinFisherYates', numbers[new_number % (upperbound - 1)]);
    }

      /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max, randnumber) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(randnumber() * (max - min + 1)) + min;
    }
    
    
  },

  /**
   * Internal function, do not call directly. Create a variant object, do not write to DB.
   * @protected
   *
   * @param {Object} question - The question for the variant.
   * @param {Object} course - The course for the variant.
   * @param {Object} options - Options controlling the creation: options = {variant_seed}
   * @param {function} callback - A callback(err, courseIssues, variant) function.
   */

  //   sqldb.call('variants_peek', [instance_question_id, question_id, course.id, user_id], (err, result) => {
  //     if (ERR(err, callback)) return;
  //     const new_number = result;
  //     debug('variants_peeked everything', new_number);
  // });
  _makeUniqueVariant(user_id, question, course, options, new_number, callback) {
    debug('_makeUniqueVariant()');
    var variant_seed;
    if (_(options).has('variant_seed') && options.variant_seed != null) {
      variant_seed = options.variant_seed;
    } else {
      variant_seed = Math.floor(Math.random() * Math.pow(2, 32)).toString(36);
    }
    debug(`_makeUniqueVariant(): question_id = ${question.id}`);
    const variant_key = fisheryates(user_id, new_number, question.unique_variants_max); 
    questionServers.getModule(question.type, (err, questionModule) => {
      if (ERR(err, callback)) return;
      questionModule.generate(question, course, variant_seed, (err, courseIssues, data) => {
        if (ERR(err, callback)) return;
        debug('variantkey', variant_key);
        const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
        var variant = {
          variant_seed: variant_seed,
          params: data.params || {},
          true_answer: data.true_answer || {},
          options: data.options || {},
          broken: hasFatalIssue,
        };
        if (question.workspace_image !== null) {
          // if workspace, add graded files to params
          variant.params['_workspace_required_file_names'] = (
            question.workspace_graded_files || []
          ).filter((file) => !fg.isDynamicPattern(file, workspaceHelper.fastGlobDefaultOptions));
          if (!('_required_file_names' in variant.params)) {
            variant.params['_required_file_names'] = [];
          }
          variant.params['_required_file_names'] = variant.params['_required_file_names'].concat(
            variant.params['_workspace_required_file_names']
          );
        }
        if (variant.broken) {
          return callback(null, courseIssues, variant);
        }
        questionModule.prepare(question, course, variant, (err, extraCourseIssues, data) => {
          if (ERR(err, callback)) return;
          courseIssues.push(...extraCourseIssues);
          const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
          var variant = {
            variant_seed: variant_seed,
            params: data.params || {},
            true_answer: data.true_answer || {},
            options: data.options || {},
            broken: hasFatalIssue,
          };
          
          callback(null, courseIssues, variant);
        });
      }, variant_key);
    });
    //fisher yates 0-upperbound --> correspond to the question


    function fisheryates(userid, new_number, upperbound) { // how to access userid?
      const rng = seedrandom(userid) // set the random seed
      
      // fisher yates
    
      // var upperbound = question.uniqueVariantsOptions.max  // total number of variants

      var numbers = new Array(upperbound);
    
      // populate array with 0 ... upperbound - 1
      for (var i = 0; i < upperbound; i++) {
        numbers[i] = i;
      }
      debug('fisherYates zeros', numbers);
    
      
      for (i = upperbound - 1; i >= 0; i--)
      {
        const randomnumber = getRandomInt(0, upperbound - 1, rng);
    
    
        // swap
        var tmp = numbers[i];
        numbers[i] = numbers[randomnumber];
        numbers[randomnumber] = tmp;
      } // need to connect the array to the questions
      debug('fisherYates upperbound', upperbound);
      debug('fisherYates numbersarray', numbers);
      debug('fisherYates new_number', new_number);
      return numbers[new_number % (upperbound)]; // how to access data and variantid, mod (upperbound - 1) just bandaid before double something
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max, randnumber) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(randnumber() * (max - min + 1)) + min;
    }     
  },

  /**
   * Get a file that is generated by code.
   *
   * @param {String} filename
   * @param {Object} variant - The variant.
   * @param {Object} question - The question for the variant.
   * @param {Object} variant_course - The course for the variant.
   * @param {string} authn_user_id - The current authenticated user.
   * @param {function} callback - A callback(err, fileData) function.
   */
  getFile(filename, variant, question, variant_course, authn_user_id, callback) {
    questionServers.getModule(question.type, (err, questionModule) => {
      if (ERR(err, callback)) return;
      util.callbackify(module.exports.getQuestionCourse)(
        question,
        variant_course,
        (err, question_course) => {
          if (ERR(err, callback)) return;
          questionModule.file(
            filename,
            variant,
            question,
            question_course,
            (err, courseIssues, fileData) => {
              if (ERR(err, callback)) return;

              const studentMessage = 'Error creating file: ' + filename;
              const courseData = { variant, question, course: variant_course };
              module.exports._writeCourseIssues(
                courseIssues,
                variant,
                authn_user_id,
                studentMessage,
                courseData,
                (err) => {
                  if (ERR(err, callback)) return;

                  return callback(null, fileData);
                },
              );
            },
          );
        },
      );
    });
  },

  /**
   * Internal function, do not call directly. Get a question by either question_id or instance_question_id.
   * @protected
   *
   * @param {?number} question_id - The question for the new variant. Can be null if instance_question_id is provided.
   * @param {?number} instance_question_id - The instance question for the new variant. Can be null if question_id is provided.
   * @param {function} callback - A callback(err, question) function.
   */
  _selectQuestion(question_id, instance_question_id, callback) {
    if (question_id != null) {
      sqldb.callOneRow('questions_select', [question_id], (err, result) => {
        if (ERR(err, callback)) return;
        const question = result.rows[0];
        callback(null, question);
      });
    } else {
      if (instance_question_id == null) {
        return callback(new Error('question_id and instance_question_id cannot both be null'));
      }
      sqldb.callOneRow(
        'instance_questions_select_question',
        [instance_question_id],
        (err, result) => {
          if (ERR(err, callback)) return;
          const question = result.rows[0];
          callback(null, question);
        },
      );
    }
  },

  //TODO: modify this function to choose between _makeVariant and _makeUniqueVariant
  //      based on the question.unique_variants_enabled flag
  /**
  /**
   * Internal function, do not call directly. Create a variant object, and write it to the DB.
   * @protected
   *
   * @param {?number} question_id - The question for the new variant. Can be null if instance_question_id is provided.
   * @param {?number} instance_question_id - The instance question for the new variant, or null for a floating variant.
   * @param {string} user_id - The user for the new variant.
   * @param {string} authn_user_id - The current authenticated user.
   * @param {boolean} group_work - If the assessment will support group work.
   * @param {Object} variant_course - The course for the variant.
   * @param {Object} question_course - The course for the question.
   * @param {Object} options - Options controlling the creation: options = {variant_seed}
   * @param {function} callback - A callback(err, variant) function.
   */
  _makeAndInsertVariant(
    question_id,
    instance_question_id,
    user_id,
    authn_user_id,
    group_work,
    course_instance_id,
    variant_course,
    question_course,
    options,
    require_open,
    callback,
  ) {
    var new_number; // added new number so can access in makeuniquevariant
    module.exports._selectQuestion(question_id, instance_question_id, (err, question) => {
      if (ERR(err, callback)) return;
<<<<<<< HEAD:lib/question.js
      debug("instance_question_id:", instance_question_id)
      debug("peeking variants")
      
      debug(`ensureVariant(): user_id = ${user_id}`);
      debug(`ensureVariant(): instance_question_id = ${instance_question_id}`);
      debug(`ensureVariant(): question_id = ${question_id}`);

      sqldb.call('variants_peek', [instance_question_id, question_id, course.id, user_id], (err, result) => {
        if (ERR(err, callback)) return;
<<<<<<< HEAD
        new_number = result.rows[0].new_number;
        debug('variants_peeked everything', new_number);
        if (question.unique_variants_enabled) {
          module.exports._makeUniqueVariant(question, course, options, new_number, (err, courseIssues, variant) => {
=======
        const new_number = result.rows[0].new_number - 1;
        debug('variants_peeked everything', new_number);

        if (question.unique_variants_enabled){
          module.exports._makeUniqueVariant(user_id, question, course, options, new_number, (err, courseIssues, variant) => {
>>>>>>> 3d2cfedf8de758b8207f0cc8fc548d940bf6f4fb
            if (ERR(err, callback)) return;
            const params = [
              variant.variant_seed,
              variant.params,
              variant.true_answer,
              variant.options,
              variant.broken,
              instance_question_id,
              question.id,
              course_instance_id,
              user_id,
              authn_user_id,
              group_work,
              require_open,
            ];
            sqldb.callOneRow('variants_insert', params, (err, result) => {
<<<<<<< HEAD
              if (ERR(err, callback)) return;
              const params = [
                variant.variant_seed,
                variant.params,
                variant.true_answer,
                variant.options,
                variant.broken,
                instance_question_id,
                question.id,
                course_instance_id,
                user_id,
                authn_user_id,
                group_work,
                require_open,
              ];
              sqldb.callOneRow('variants_insert', params, (err, result) => {
                if (ERR(err, callback)) return;
                const variant = result.rows[0].variant;
                debug('variants_insert', variant);
    
                const studentMessage = 'Error creating question variant';
                const courseData = { variant, question, course };
                module.exports._writeCourseIssues(
                  courseIssues,
                  variant,
                  authn_user_id,
                  studentMessage,
                  courseData,
                  (err) => {
                    if (ERR(err, callback)) return;
                    return callback(null, variant);
                  }
                );
              });
            });
          })} else {
            module.exports._makeVariant(question, course, options, (err, courseIssues, variant) => {
              if (ERR(err, callback)) return;
              const params = [
                variant.variant_seed,
                variant.params,
                variant.true_answer,
                variant.options,
                variant.broken,
                instance_question_id,
                question.id,
                course_instance_id,
                user_id,
                authn_user_id,
                group_work,
                require_open,
              ];
              sqldb.callOneRow('variants_insert', params, (err, result) => {
                if (ERR(err, callback)) return;
                const variant = result.rows[0].variant;
                debug('variants_insert', variant);
    
                const studentMessage = 'Error creating question variant';
                const courseData = { variant, question, course };
                module.exports._writeCourseIssues(
                  courseIssues,
                  variant,
                  authn_user_id,
                  studentMessage,
                  courseData,
                  (err) => {
                    if (ERR(err, callback)) return;
                    return callback(null, variant);
                  }
                );
              });
            });
          }
    });
=======
              if (ERR(err, callback)) return;
              const variant = result.rows[0].variant;
              debug('variants_insert', variant);
    
              const studentMessage = 'Error creating question variant';
              const courseData = { variant, question, course };
              module.exports._writeCourseIssues(
                courseIssues,
                variant,
                authn_user_id,
                studentMessage,
                courseData,
                (err) => {
                  if (ERR(err, callback)) return;
                  return callback(null, variant);
              });
            });
          });
        } else {
        module.exports._makeVariant(question, course, options, (err, courseIssues, variant) => {
        if (ERR(err, callback)) return;
        const params = [
          variant.variant_seed,
          variant.params,
          variant.true_answer,
          variant.options,
          variant.broken,
          instance_question_id,
          question.id,
          course_instance_id,
          user_id,
          authn_user_id,
          group_work,
          require_open,
        ];
        sqldb.callOneRow('variants_insert', params, (err, result) => {
=======
      module.exports._makeVariant(
        question,
        question_course,
        options,
        (err, courseIssues, variant) => {
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
          if (ERR(err, callback)) return;
          const params = [
            variant.variant_seed,
            variant.params,
            variant.true_answer,
            variant.options,
            variant.broken,
            instance_question_id,
            question.id,
            course_instance_id,
            user_id,
            authn_user_id,
<<<<<<< HEAD:lib/question.js
            studentMessage,
            courseData,
            (err) => {
              if (ERR(err, callback)) return;
              return callback(null, variant);
              }
            );
          });
        });
      };
>>>>>>> 3d2cfedf8de758b8207f0cc8fc548d940bf6f4fb
=======
            group_work,
            require_open,
            variant_course.id,
          ];
          sqldb.callOneRow('variants_insert', params, (err, result) => {
            if (ERR(err, callback)) return;
            const variant = result.rows[0].variant;
            debug('variants_insert', variant);

            const studentMessage = 'Error creating question variant';
            const courseData = { variant, question, course: variant_course };
            module.exports._writeCourseIssues(
              courseIssues,
              variant,
              authn_user_id,
              studentMessage,
              courseData,
              (err) => {
                if (ERR(err, callback)) return;
                return callback(null, variant);
              },
            );
          });
        },
      );
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
    });
  });
},

  /**
   * Ensure that there is a variant for the given instance question.
   *
   * @param {?number} question_id - The question for the new variant. Can be null if instance_question_id is provided.
   * @param {?number} instance_question_id - The instance question for the new variant, or null for a floating variant.
   * @param {string} user_id - The user for the new variant.
   * @param {string} authn_user_id - The current authenticated user.
   * @param {boolean} group_work - If the assessment will support group work.
   * @param {?number} course_instance_id - The course instance for this variant. Can be null for instructor questions.
   * @param {Object} variant_course - The course for the variant.
   * @param {Object} question_course - The course for the question.
   * @param {Object} options - Options controlling the creation: options = {variant_seed}
   * @param {boolean} require_open - If true, only use an existing variant if it is open.
   * @param {function} callback - A callback(err, variant) function.
   */
  ensureVariant(
    question_id,
    instance_question_id,
    user_id,
    authn_user_id,
    group_work,
    course_instance_id,
    variant_course,
    question_course,
    options,
    require_open,
    callback,
  ) {
    if (instance_question_id != null) {
      // see if we have a useable existing variant, otherwise
      // make a new one
      var params = [instance_question_id, require_open];
      sqldb.call('instance_questions_select_variant', params, (err, result) => {
        if (ERR(err, callback)) return;
        const variant = result.rows[0].variant;
        if (variant != null) {
          debug('instance_questions_select_variant not null', variant);
          return callback(null, variant);
        }
        module.exports._makeAndInsertVariant(
          question_id,
          instance_question_id,
          user_id,
          authn_user_id,
          group_work,
          course_instance_id,
          variant_course,
          question_course,
          options,
          require_open,
          (err, variant) => {
            if (ERR(err, callback)) return;
            debug(
              'instance_questions_select_variant was null, run through _makeAndInsertVariant',
              variant,
            );
            callback(null, variant);
          },
        );
      });
    } else {
      // if we don't have instance_question_id, just make a new variant
      module.exports._makeAndInsertVariant(
        question_id,
        instance_question_id,
        user_id,
        authn_user_id,
        group_work,
        course_instance_id,
        variant_course,
        question_course,
        options,
        require_open,
        (err, variant) => {
          if (ERR(err, callback)) return;
          callback(null, variant);
        },
      );
    }
  },

  /**
   * Save a new submission to a variant into the database.
   *
   * @param {Object} submission - The submission to save (should not have an id property yet).
   * @param {Object} variant - The variant to submit to.
   * @param {Object} question - The question for the variant.
   * @param {Object} variant_course - The course for the variant.
   * @param {function} callback - A callback(err, submission_id) function.
   */
  saveSubmission(submission, variant, question, variant_course, callback) {
    debug('saveSubmission()');
    submission.raw_submitted_answer = submission.submitted_answer;
    submission.gradable = true;
    let questionModule, question_course, courseIssues, data, submission_id, workspace_id, zipPath;
    async.series(
      [
        (callback) => {
          // if workspace, get workspace_id
          if (question.workspace_image != null) {
            const params = {
              variant_id: submission.variant_id,
            };
            sqldb.queryZeroOrOneRow(sql.select_workspace_id, params, (err, result) => {
              if (ERR(err, callback)) return;
              if (result.rowCount > 0) {
                workspace_id = result.rows[0].workspace_id;
              }
              callback(null);
            });
          } else {
            callback(null);
          }
        },
        async () => {
          // if we have a workspace and any files to be graded, get the files
          if (workspace_id == null || !question.workspace_graded_files?.length) {
            debug('saveSubmission()', 'not getting workspace graded files');
            return;
          }
          try {
            zipPath = await workspaceHelper.getGradedFiles(workspace_id);
            debug('saveSubmission()', `saved graded files: ${zipPath}`);
          } catch (err) {
            if (err instanceof workspaceHelper.SubmissionFormatError) {
              ((submission.format_errors ??= {})._files ??= []).push(err.message);
            } else {
              throw err;
            }
          }
        },
        async () => {
          // if we have workspace files, encode them into _files
          if (zipPath == null) return;

          const zip = fs.createReadStream(zipPath).pipe(unzipper.Parse({ forceStream: true }));
          if (!('_files' in submission.submitted_answer)) {
            submission.submitted_answer['_files'] = [];
          }

          for await (const zipEntry of zip) {
            const name = zipEntry.path;
            const contents = (await zipEntry.buffer()).toString('base64');
            submission.submitted_answer['_files'].push({ name, contents });
          }
          await fs.promises.unlink(zipPath);
        },
        (callback) => {
          questionServers.getModule(question.type, (err, ret_questionModule) => {
            if (ERR(err, callback)) return;
            questionModule = ret_questionModule;
            debug('saveSubmission()', 'loaded questionModule');
            callback(null);
          });
        },
        async () => {
          question_course = await module.exports.getQuestionCourse(question, variant_course);
        },
        (callback) => {
          questionModule.parse(
            submission,
            variant,
            question,
            question_course,
            (err, ret_courseIssues, ret_data) => {
              if (ERR(err, callback)) return;
              courseIssues = ret_courseIssues;
              data = ret_data;

              debug('saveSubmission()', 'completed parse()');
              callback(null);
            },
          );
        },
        (callback) => {
          const studentMessage = 'Error parsing submission';
          const courseData = { variant, question, submission, course: variant_course };
          module.exports._writeCourseIssues(
            courseIssues,
            variant,
            submission.auth_user_id,
            studentMessage,
            courseData,
            (err) => {
              if (ERR(err, callback)) return;
              debug('saveSubmission()', `wrote courseIssues: ${courseIssues.length}`);
              callback(null);
            },
          );
        },
        (callback) => {
          const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
          if (hasFatalIssue) data.gradable = false;
          data.broken = hasFatalIssue;

          const params = [
            data.submitted_answer,
            data.raw_submitted_answer,
            data.format_errors,
            data.gradable,
            data.broken,
            data.true_answer,
            data.feedback,
            false, // regradable
            submission.credit,
            submission.mode,
            submission.variant_id,
            submission.auth_user_id,
          ];
          sqldb.callOneRow('submissions_insert', params, (err, result) => {
            if (ERR(err, callback)) return;
            submission_id = result.rows[0].submission_id;
            debug('saveSubmission()', 'inserted', 'submission_id:', submission_id);
            callback(null);
          });
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        debug('saveSubmission()', 'returning', 'submission_id:', submission_id);
        callback(null, submission_id);
      },
    );
  },

  /**
   * Get the course associated with the question
   *
   * @param {Object} question - The question for the variant.
   * @param {Object} variant_course - The course for the variant.
   */
  async getQuestionCourse(question, variant_course) {
    if (question.course_id === variant_course.id) {
      return variant_course;
    } else {
      let result = await sqldb.queryOneRowAsync(sql.select_question_course, {
        question_course_id: question.course_id,
      });
      return result.rows[0].course;
    }
  },

  /**
   * Grade the most recent submission for a given variant.
   *
   * @param {Object} variant - The variant to grade.
   * @param {string | null} check_submission_id - The submission_id that must be graded (or null to skip this check).
   * @param {Object} question - The question for the variant.
<<<<<<< HEAD:lib/question.js
   * @param {Object} course - The course for the variant.
   * @param {number} authn_user_id - The currently authenticated user.
=======
   * @param {Object} variant_course - The course for the variant.
   * @param {string | null} authn_user_id - The currently authenticated user.
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
   * @param {boolean} overrideGradeRateCheck - Whether to override grade rate limits.
   * @param {function} callback - A callback(err) function.
   */
  gradeVariant(
    variant,
    check_submission_id,
    question,
    variant_course,
    authn_user_id,
    overrideGradeRateCheck,
    callback,
  ) {
    debug('_gradeVariant()');
    let questionModule, question_course, courseIssues, data, submission, grading_job;
    async.series(
      [
        async () => {
          question_course = await module.exports.getQuestionCourse(question, variant_course);
        },
        (callback) => {
          var params = [variant.id, check_submission_id];
          sqldb.callZeroOrOneRow(
            'variants_select_submission_for_grading',
            params,
            (err, result) => {
              if (ERR(err, callback)) return;
              if (result.rowCount === 0) return callback(new NoSubmissionError());
              submission = result.rows[0];
              debug('_gradeVariant()', 'selected submission', 'submission.id:', submission.id);
              callback(null);
            },
          );
        },
        (callback) => {
          if (overrideGradeRateCheck) return callback(null);
          var params = [variant.instance_question_id];
          sqldb.callZeroOrOneRow('instance_questions_next_allowed_grade', params, (err, result) => {
            if (ERR(err, callback)) return;
            debug(
              '_gradeVariant()',
              'checked grade rate',
              'allow_grade_left_ms:',
              result.rows[0].allow_grade_left_ms,
            );
            if (result.rows[0].allow_grade_left_ms > 0) return callback(new NoSubmissionError());
            callback(null);
          });
        },
        (callback) => {
          const params = [submission.id, authn_user_id];
          sqldb.callOneRow('grading_jobs_insert', params, (err, result) => {
            if (ERR(err, callback)) return;

            grading_job = result.rows[0];
            debug('_gradeVariant()', 'inserted', 'grading_job.id:', grading_job.id);
            callback(null);
          });
        },
        (callback) => {
          questionServers.getModule(question.type, (err, ret_questionModule) => {
            if (ERR(err, callback)) return;
            questionModule = ret_questionModule;
            debug('_gradeVariant()', 'loaded questionModule');
            callback(null);
          });
        },
        (callback) => {
          if (question.grading_method !== 'External') {
            // For Internal grading we call the grading code. For Manual grading, if the question
            // reached this point, it has auto points, so it should be treated like Internal.
            questionModule.grade(
              submission,
              variant,
              question,
              question_course,
              (err, ret_courseIssues, ret_data) => {
                if (ERR(err, callback)) return;
                courseIssues = ret_courseIssues;
                data = ret_data;
                const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
                if (hasFatalIssue) data.gradable = false;
                data.broken = hasFatalIssue;
                debug('_gradeVariant()', 'completed grade()', 'hasFatalIssue:', hasFatalIssue);
                callback(null);
              },
            );
          } else {
            // for External grading we don't do anything
            courseIssues = [];
            data = {};
            callback(null);
          }
        },
        (callback) => {
          const studentMessage = 'Error grading submission';
          const courseData = { variant, question, submission, course: variant_course };
          module.exports._writeCourseIssues(
            courseIssues,
            variant,
            submission.auth_user_id,
            studentMessage,
            courseData,
            (err) => {
              if (ERR(err, callback)) return;
              debug('_gradeVariant()', `wrote courseIssues: ${courseIssues.length}`);
              callback(null);
            },
          );
        },
        (callback) => {
          if (question.grading_method === 'External') {
            // We haven't actually graded this question yet - don't attempt
            // to update the grading job or submission.
            return callback(null);
          }

          const params = [
            grading_job.id,
            // `received_time` and `start_time` were already set when the
            // grading job was inserted, so they'll remain unchanged.
            // `finish_time` will be set to `now()` by this sproc.
            null, // received_time
            null, // start_time
            null, // finish_time
            data.submitted_answer,
            data.format_errors,
            data.gradable,
            data.broken,
            data.params,
            data.true_answer,
            data.feedback,
            data.partial_scores,
            data.score,
            data.v2_score,
          ];
          sqldb.callOneRow('grading_jobs_update_after_grading', params, (err, result) => {
            if (ERR(err, callback)) return;

            // If the submission was marked invalid during grading the grading
            // job will be marked ungradable and we should bail here to prevent
            // LTI updates.
            grading_job = result.rows[0];
            if (!grading_job.gradable) return callback(new NoSubmissionError());

            debug('_gradeVariant()', 'inserted', 'grading_job.id:', grading_job.id);
            callback(null);
          });
        },
        (callback) => {
          sqldb.queryOneRow(
            sql.select_assessment_for_submission,
            { submission_id: submission.id },
            (err, result) => {
              if (ERR(err, callback)) return;
              let assessment_instance_id = result.rows[0].assessment_instance_id;
              ltiOutcomes.updateScore(assessment_instance_id, (err) => {
                if (ERR(err, callback)) return;
                callback(null);
              });
            },
          );
        },
      ],
      (err) => {
        // catch NoSubmissionError as we are just using it to exit with no action
        if (err instanceof NoSubmissionError) {
          debug('_gradeVariant()', 'no submissions for grading, skipping');
          err = null;
        }
        if (ERR(err, callback)) return;
        debug('_gradeVariant()', 'success');
        // data and grading_job might not be defined if we bailed out early above
        if (data && !data.broken && grading_job && grading_job.grading_method === 'External') {
          // We need to submit this external grading job.
          externalGrader.beginGradingJob(grading_job.id, (err) => {
            if (ERR(err, callback)) return;
            callback(null);
          });
        } else {
          callback(null);
        }
      },
    );
  },

  /**
   * Save and grade a new submission to a variant.
   *
   * @param {Object} submission - The submission to save (should not have an id property yet).
   * @param {Object} variant - The variant to submit to.
   * @param {Object} question - The question for the variant.
   * @param {Object} course - The course for the variant.
   * @param {boolean} overrideGradeRateCheck - Whether to override grade rate limits.
   * @param {function} callback - A callback(err, submission_id) function.
   */
  saveAndGradeSubmission(submission, variant, question, course, overrideGradeRateCheck, callback) {
    debug('saveAndGradeSubmission()');

    let submission_id, grading_job_id;
    async.series(
      [
        (callback) => {
          module.exports.saveSubmission(
            submission,
            variant,
            question,
            course,
            (err, ret_submission_id) => {
              if (ERR(err, callback)) return;
              submission_id = ret_submission_id;
              debug('saveAndGradeSubmission()', 'submission_id:', submission_id);
              callback(null);
            },
          );
        },
        (callback) => {
          module.exports.gradeVariant(
            variant,
            submission_id,
            question,
            course,
            submission.auth_user_id,
            overrideGradeRateCheck,
            (err, ret_grading_job_id) => {
              if (ERR(err, callback)) return;
              grading_job_id = ret_grading_job_id;
              debug('saveAndGradeSubmission()', 'graded');
              callback(null);
            },
          );
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        debug('saveAndGradeSubmission()', 'returning submission_id:', submission_id);
        if (grading_job_id !== undefined) {
          // We need to submit this grading job now that the
          // transaction has been committed
          externalGrader.beginGradingJob(grading_job_id, (err) => {
            if (ERR(err, callback)) return;
            callback(null, submission_id);
          });
        } else {
          // We're done!
          callback(null, submission_id);
        }
      },
    );
  },

  /**
   * Internal worker for testVariant(). Do not call directly.
   * @protected
   *
   * @param {Object} variant - The variant to submit to.
   * @param {Object} question - The question for the variant.
   * @param {Object} variant_course - The course for the variant.
   * @param {string} test_type - The type of test to run.  Should be one of 'correct', 'incorrect', or 'invalid'.
   * @param {string} authn_user_id - The currently authenticated user.
   * @param {function} callback - A callback(err, submission_id) function.
   */
  _createTestSubmission(variant, question, variant_course, test_type, authn_user_id, callback) {
    debug('_createTestSubmission()');
    if (question.type !== 'Freeform') return callback(new Error('question.type must be Freeform'));
    let questionModule, question_course, courseIssues, data, submission_id, grading_job;
    async.series(
      [
        (callback) => {
          questionServers.getModule(question.type, (err, ret_questionModule) => {
            if (ERR(err, callback)) return;
            questionModule = ret_questionModule;
            debug('_createTestSubmission()', 'loaded questionModule');
            callback(null);
          });
        },
        async () => {
          question_course = await module.exports.getQuestionCourse(question, variant_course);
        },
        (callback) => {
          questionModule.test(
            variant,
            question,
            question_course,
            test_type,
            (err, ret_courseIssues, ret_data) => {
              if (ERR(err, callback)) return;
              courseIssues = ret_courseIssues;
              data = ret_data;
              const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
              data.broken = hasFatalIssue;
              debug('_createTestSubmission()', 'completed test()');
              callback(null);
            },
          );
        },
        (callback) => {
          const studentMessage = 'Error creating test submission';
          const courseData = { variant, question, course: variant_course };
          module.exports._writeCourseIssues(
            courseIssues,
            variant,
            authn_user_id,
            studentMessage,
            courseData,
            (err) => {
              if (ERR(err, callback)) return;
              debug('_createTestSubmission()', `wrote courseIssues: ${courseIssues.length}`);
              callback(null);
            },
          );
        },
        (callback) => {
          const hasFatalIssue = _.some(_.map(courseIssues, 'fatal'));
          if (hasFatalIssue) data.gradable = false;

          const params = [
            {}, // submitted_answer
            data.raw_submitted_answer,
            data.format_errors,
            data.gradable,
            data.broken,
            // The `test` phase is not allowed to mutate `correct_answers`
            // (aliased here to `true_answer`), so we just pick the original
            // `true_answer` so we can use our standard `submissions_insert`
            // sproc.
            variant.true_answer,
            null, // feedback
            true, // regradable
            null, // credit
            null, // mode
            variant.id,
            authn_user_id,
          ];
          sqldb.callOneRow('submissions_insert', params, (err, result) => {
            if (ERR(err, callback)) return;
            submission_id = result.rows[0].submission_id;
            debug('_createTestSubmission()', 'inserted', 'submission_id:', submission_id);
            callback(null);
          });
        },
        (callback) => {
          const params = [submission_id, authn_user_id];
          sqldb.callOneRow('grading_jobs_insert', params, (err, result) => {
            if (ERR(err, callback)) return;
            grading_job = result.rows[0];
            debug('_createTestSubmission()', 'inserted', 'grading_job_id:', grading_job.id);
            callback(null);
          });
        },
        (callback) => {
          const params = [
            grading_job.id,
            null, // received_time
            null, // start_time
            null, // finish_tim
            {}, // submitted_answer
            data.format_errors,
            data.gradable,
            data.broken,
            data.params,
            data.true_answer,
            data.feedback,
            data.partial_scores,
            data.score,
            null, // v2_score
          ];
          sqldb.callOneRow('grading_jobs_update_after_grading', params, (err, result) => {
            if (ERR(err, callback)) return;
            grading_job = result.rows[0];
            debug('_createTestSubmission()', 'inserted', 'grading_job.id:', grading_job.id);
            callback(null);
          });
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        debug('_createTestSubmission()', 'returning', 'submission_id:', submission_id);
        callback(null, submission_id);
      },
    );
  },

  /**
   * Internal worker for testVariant(). Do not call directly.
   * @protected
   *
   * @param {Object} expected_submission - Generated reference submission data.
   * @param {Object} test_submission - Computed submission to be tested.
   * @param {function} callback - A callback(err, courseIssues) function.
   */
  _compareSubmissions(expected_submission, test_submission, callback) {
    const courseIssues = [];

    const checkEqual = (name, var1, var2) => {
      const json1 = jsonStringifySafe(var1);
      const json2 = jsonStringifySafe(var2);
      if (!_.isEqual(var1, var2)) {
        courseIssues.push(new Error(`"${name}" mismatch: expected "${json1}" but got "${json2}"`));
      }
    };

    if (expected_submission.broken) {
      courseIssues.push(new Error('expected_submission is broken, skipping tests'));
      return callback(null, courseIssues);
    }
    if (test_submission.broken) {
      courseIssues.push(new Error('test_submission is broken, skipping tests'));
      return callback(null, courseIssues);
    }
    checkEqual('gradable', expected_submission.gradable, test_submission.gradable);
    checkEqual(
      'format_errors keys',
      Object.keys(expected_submission.format_errors),
      Object.keys(test_submission.format_errors),
    );
    if (!test_submission.gradable || !expected_submission.gradable) {
      return callback(null, courseIssues);
    }
    checkEqual(
      'partial_scores',
      expected_submission.partial_scores,
      test_submission.partial_scores,
    );
    checkEqual('score', expected_submission.score, test_submission.score);
    callback(null, courseIssues);
  },

  /**
   * Internal worker for _testQuestion(). Do not call directly.
   * Tests a question variant. Issues will be inserted into the issues table.
   * @protected
   *
   * @param {Object} variant - The variant to submit to.
   * @param {Object} question - The question for the variant.
   * @param {Object} course - The course for the variant.
   * @param {string} test_type - The type of test to run.  Should be one of 'correct', 'incorrect', or 'invalid'.
   * @param {string} authn_user_id - The currently authenticated user.
   * @param {function} callback - A callback(err) function.
   */
  _testVariant(variant, question, course, test_type, authn_user_id, callback) {
    debug('_testVariant()');
    let expected_submission_id, expected_submission, test_submission_id, test_submission;
    async.series(
      [
        (callback) => {
          module.exports._createTestSubmission(
            variant,
            question,
            course,
            test_type,
            authn_user_id,
            (err, ret_submission_id) => {
              if (ERR(err, callback)) return;
              expected_submission_id = ret_submission_id;
              debug('_testVariant()', 'expected_submission_id:', expected_submission_id);
              callback(null);
            },
          );
        },
        (callback) => {
          sqldb.callOneRow('submissions_select', [expected_submission_id], (err, result) => {
            if (ERR(err, callback)) return;
            expected_submission = result.rows[0];
            debug('_testVariant()', 'selected expected_submission, id:', expected_submission.id);
            callback(null);
          });
        },
        (callback) => {
          const submission = {
            variant_id: variant.id,
            auth_user_id: authn_user_id,
            submitted_answer: expected_submission.raw_submitted_answer,
          };
          module.exports.saveSubmission(
            submission,
            variant,
            question,
            course,
            (err, ret_submission_id) => {
              if (ERR(err, callback)) return;
              test_submission_id = ret_submission_id;
              debug('_testVariant()', 'test_submission_id:', test_submission_id);
              callback(null);
            },
          );
        },
        (callback) => {
          module.exports.gradeVariant(
            variant,
            test_submission_id,
            question,
            course,
            authn_user_id,
            true,
            (err) => {
              if (ERR(err, callback)) return;
              debug('testVariant()', 'graded');
              callback(null);
            },
          );
        },
        (callback) => {
          sqldb.callOneRow('submissions_select', [test_submission_id], (err, result) => {
            if (ERR(err, callback)) return;
            test_submission = result.rows[0];
            debug('_testVariant()', 'selected test_submission, id:', test_submission.id);
            callback(null);
          });
        },
        (callback) => {
          module.exports._compareSubmissions(
            expected_submission,
            test_submission,
            (err, courseIssues) => {
              if (ERR(err, callback)) return;
              const studentMessage = 'Question test failure';
              const courseData = {
                variant,
                question,
                course,
                expected_submission,
                test_submission,
              };
              module.exports._writeCourseIssues(
                courseIssues,
                variant,
                authn_user_id,
                studentMessage,
                courseData,
                (err) => {
                  if (ERR(err, callback)) return;
                  callback(null);
                },
              );
            },
          );
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        debug('_testVariant()', 'returning');
        callback(null, expected_submission, test_submission);
      },
    );
  },

  /**
   * Test a question. Issues will be inserted into the issues table.
   *
   * @param {Object} question - The question for the variant.
   * @param {boolean} group_work - If the assessment will support group work.
   * @param {Object} variant_course - The course for the variant.
   * @param {string} authn_user_id - The currently authenticated user.
   * @param {string} test_type - The type of test to run.  Should be one of 'correct', 'incorrect', or 'invalid'.
   * @param {function} callback - A callback(err, variant) function.
   */
  _testQuestion(
    question,
    group_work,
    course_instance,
    variant_course,
    test_type,
    authn_user_id,
    callback,
  ) {
    debug('_testQuestion()');

    let variant,
      question_course,
      expected_submission = null,
      test_submission = null;
    async.series(
      [
        async () => {
          question_course = await module.exports.getQuestionCourse(question, variant_course);
        },
        (callback) => {
          const instance_question_id = null;
          const course_instance_id = (course_instance && course_instance.id) || null;
          const options = {};
          const require_open = true;
          module.exports.ensureVariant(
            question.id,
            instance_question_id,
            authn_user_id,
            authn_user_id,
            group_work,
            course_instance_id,
            variant_course,
            question_course,
            options,
            require_open,
            (err, ret_variant) => {
              if (ERR(err, callback)) return;
              variant = ret_variant;
              debug('_testQuestion()', 'created variant_id: :', variant.id);
              callback(null);
            },
          );
        },
        (callback) => {
          if (variant.broken) return callback(null);
          module.exports._testVariant(
            variant,
            question,
            variant_course,
            test_type,
            authn_user_id,
            (err, ret_expected_submission, ret_test_submission) => {
              if (ERR(err, callback)) return;
              expected_submission = ret_expected_submission;
              test_submission = ret_test_submission;
              debug(
                '_testQuestion()',
                'tested',
                'expected_submission_id:',
                expected_submission ? expected_submission.id : null,
                'test_submission_id:',
                test_submission ? test_submission.id : null,
              );
              callback(null);
            },
          );
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        debug('_testQuestion()', 'returning');
        callback(null, variant, expected_submission, test_submission);
      },
    );
  },

  /**
   * Internal worker for _testQuestion(). Do not call directly.
   * Runs a single test.
   * @protected
   *
   * @param {Object} logger - The server job to run within.
   * @param {boolean} showDetails - Whether to display test data details.
   * @param {Object} question - The question for the variant.
   * @param {boolean} group_work - If the assessment will support group work.
   * @param {Object} course - The course for the variant.
   * @param {string} test_type - The type of test to run.  Should be one of 'correct', 'incorrect', or 'invalid'.
   * @param {string} authn_user_id - The currently authenticated user.
   * @param {function} callback - A callback(err, success) function.
   */
  _runTest(
    logger,
    showDetails,
    question,
    group_work,
    course_instance,
    course,
    test_type,
    authn_user_id,
    callback,
  ) {
    let variant,
      expected_submission,
      test_submission,
      success = true;
    async.series(
      [
        (callback) => {
          logger.verbose('Testing ' + question.qid);
          module.exports._testQuestion(
            question,
            group_work,
            course_instance,
            course,
            test_type,
            authn_user_id,
            (err, ret_variant, ret_expected_submission, ret_test_submission) => {
              if (ERR(err, callback)) return;
              variant = ret_variant;
              expected_submission = ret_expected_submission;
              test_submission = ret_test_submission;
              callback(null);
            },
          );
        },
        (callback) => {
          if (!showDetails) return callback(null);
          const variantKeys = ['broken', 'options', 'params', 'true_answer', 'variant_seed'];
          const submissionKeys = [
            'broken',
            'correct',
            'feedback',
            'format_errors',
            'gradable',
            'grading_method',
            'partial_scores',
            'raw_submitted_answer',
            'score',
            'submitted_answer',
            'true_answer',
          ];
          logger.verbose(
            'variant:\n' + jsonStringifySafe(_.pick(variant, variantKeys), null, '    '),
          );
          if (_.isObject(expected_submission)) {
            logger.verbose(
              'expected_submission:\n' +
                jsonStringifySafe(_.pick(expected_submission, submissionKeys), null, '    '),
            );
          }
          if (_.isObject(test_submission)) {
            logger.verbose(
              'test_submission:\n' +
                jsonStringifySafe(_.pick(test_submission, submissionKeys), null, '    '),
            );
          }
          callback(null);
        },
        async () => {
          const result = await sqldb.queryOneRowAsync(sql.select_issue_count_for_variant, {
            variant_id: variant.id,
          });

          if (result.rows[0].count > 0) {
            success = false;
            logger.verbose(`ERROR: ${result.rows[0].count} issues encountered during test.`);
          } else {
            logger.verbose('Success: no issues during test');
          }
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        callback(null, success);
      },
    );
  },

  /**
   * Start a job sequence to test a question.
   *
   * @param {number} count - The number of times to test, will run each possible test ('correct, 'incorrect,' invalid') this many times.
   * @param {boolean} showDetails - Whether to display test data details.
   * @param {Object} question - The question for the variant.
   * @param {boolean} group_work - If the assessment will support group work
   * @param {Object} course_instance - The course instance for the variant; may be null for instructor questions
   * @param {Object} course - The course for the variant.
   * @param {string} authn_user_id - The currently authenticated user.
   * @return {Promise<string>} The job sequence ID.
   */
  async startTestQuestion(
    count,
    showDetails,
    question,
    group_work,
    course_instance,
    course,
    authn_user_id,
  ) {
    let success = true;
    const test_types = ['correct', 'incorrect', 'invalid'];

    const serverJob = await createServerJob({
      courseId: course.id,
      userId: String(authn_user_id),
      authnUserId: String(authn_user_id),
      type: 'test_question',
      description: 'Test ' + question.qid,
    });

    serverJob.executeInBackground(async (job) => {
      await async.eachSeries(_.range(count * test_types.length), (iter, callback) => {
        let type = test_types[iter % test_types.length];
        job.verbose(`Test ${Math.floor(iter / test_types.length) + 1}, type ${type}`);
        module.exports._runTest(
          job,
          showDetails,
          question,
          group_work,
          course_instance,
          course,
          type,
          authn_user_id,
          (err, ret_success) => {
            if (ERR(err, callback)) return;
            success = success && ret_success;
            callback(null);
          },
        );
      });

      if (!success) {
        throw new Error('Some tests failed. See the "Errors" page for details.');
      }
    });

    return serverJob.jobSequenceId;
  },

  /**
   * Internal worker. Do not call directly. Renders the HTML for a variant.
   * @protected
   *
   * @param {Object} renderSelection - Specify which panels should be rendered.
   * @param {Object} variant - The variant to submit to.
   * @param {Object} question - The question for the variant.
   * @param {Object} submission - The current submission to the variant.
   * @param {Array} submissions - The full list of submissions to the variant.
   * @param {Object} variant_course - The course for the variant.
   * @param {Object} question_course - The course for the question.
   * @param {Object} course_instance - The course_instance for the variant.
   * @param {Object} locals - The current locals for the page response.
   * @param {function} callback - A callback(err, courseIssues, htmls) function.
   */
  _render(
    renderSelection,
    variant,
    question,
    submission,
    submissions,
    variant_course,
    question_course,
    course_instance,
    locals,
    callback,
  ) {
    questionServers.getModule(question.type, (err, questionModule) => {
      if (ERR(err, callback)) return;
      questionModule.render(
        renderSelection,
        variant,
        question,
        submission,
        submissions,
        question_course,
        course_instance,
        locals,
        (err, courseIssues, htmls) => {
          if (ERR(err, callback)) return;

          const studentMessage = 'Error rendering question';
          const courseData = { variant, question, submission, course: variant_course };
          // locals.authn_user may not be populated when rendering a panel
          const user_id = locals && locals.authn_user ? locals.authn_user.user_id : null;
          module.exports._writeCourseIssues(
            courseIssues,
            variant,
            user_id,
            studentMessage,
            courseData,
            (err) => {
              if (ERR(err, callback)) return;
              return callback(null, htmls);
            },
          );
        },
      );
    });
  },

  /**
   * Internal helper function to generate URLs that are used to render
   * question panels.
   *
   * @param  {String} urlPrefix         The prefix of the generated URLs.
   * @param  {Object} variant           The variant object for this question.
   * @param  {Object} question          The question.
   * @param  {Object} instance_question The instance question.
   * @param  {Object} assessment        The assessment.
   * @return {Object}                   An object containing the named URLs.
   */
  _buildQuestionUrls(urlPrefix, variant, question, instance_question, assessment) {
    const urls = {};

    if (!assessment) {
      // instructor question pages
      const questionUrl = urlPrefix + '/question/' + question.id + '/';
      urls.questionUrl = questionUrl;
      urls.newVariantUrl = questionUrl + 'preview/';
      urls.tryAgainUrl = questionUrl + 'preview/';
      urls.reloadUrl = questionUrl + 'preview/' + '?variant_id=' + variant.id;
      urls.clientFilesQuestionUrl = questionUrl + 'clientFilesQuestion';

      // necessary for backward compatibility
      urls.calculationQuestionFileUrl = questionUrl + 'file';

      urls.calculationQuestionGeneratedFileUrl =
        questionUrl + 'generatedFilesQuestion/variant/' + variant.id;

      urls.clientFilesCourseUrl = questionUrl + 'clientFilesCourse';
      urls.clientFilesQuestionGeneratedFileUrl =
        questionUrl + 'generatedFilesQuestion/variant/' + variant.id;
      urls.baseUrl = urlPrefix;
    } else {
      // student question pages
      const iqUrl = urlPrefix + '/instance_question/' + instance_question.id + '/';
      urls.questionUrl = iqUrl;
      urls.newVariantUrl = iqUrl;
      urls.tryAgainUrl = iqUrl;
      urls.reloadUrl = iqUrl + '?variant_id=' + variant.id;
      urls.clientFilesQuestionUrl = iqUrl + 'clientFilesQuestion';

      // necessary for backward compatibility
      urls.calculationQuestionFileUrl = iqUrl + 'file';

      urls.calculationQuestionGeneratedFileUrl =
        iqUrl + 'generatedFilesQuestion/variant/' + variant.id;

      urls.clientFilesCourseUrl = iqUrl + 'clientFilesCourse';
      urls.clientFilesQuestionGeneratedFileUrl =
        iqUrl + 'generatedFilesQuestion/variant/' + variant.id;
      urls.baseUrl = urlPrefix;
    }

    if (variant.workspace_id) {
      urls.workspaceUrl = `/pl/workspace/${variant.workspace_id}`;
    }

    return urls;
  },

  _buildLocals(
    variant,
    question,
    instance_question,
    assessment,
    assessment_instance,
    assessment_question,
    authz_result,
  ) {
    const locals = {};

    locals.showGradeButton = false;
    locals.showSaveButton = false;
    locals.disableGradeButton = false;
    locals.showNewVariantButton = false;
    locals.showTryAgainButton = false;
    locals.showSubmissions = false;
    locals.showFeedback = false;
    locals.showTrueAnswer = false;
    locals.showGradingRequested = false;
    locals.allowAnswerEditing = false;
    locals.hasAttemptsOtherVariants = false;
    locals.variantAttemptsLeft = 0;
    locals.variantAttemptsTotal = 0;
    locals.submissions = [];

    if (!assessment) {
      // instructor question pages
      locals.showGradeButton = true;
      locals.showSaveButton = true;
      locals.allowAnswerEditing = true;
      locals.showNewVariantButton = true;
    } else {
      // student question pages
      if (assessment.type === 'Homework') {
        locals.showGradeButton = true;
        locals.showSaveButton = true;
        locals.allowAnswerEditing = true;
        if (!question.single_variant) {
          locals.hasAttemptsOtherVariants = true;
          locals.variantAttemptsLeft = assessment_question.tries_per_variant - variant.num_tries;
          locals.variantAttemptsTotal = assessment_question.tries_per_variant;
        }
        if (question.single_variant && instance_question.score_perc >= 100.0) {
          locals.showTrueAnswer = true;
        }
      }
      if (assessment.type === 'Exam') {
        if (assessment_instance.open && instance_question.open) {
          locals.showGradeButton = true;
          locals.showSaveButton = true;
          locals.allowAnswerEditing = true;
          locals.variantAttemptsLeft = instance_question.points_list.length;
          locals.variantAttemptsTotal = instance_question.points_list_original.length;
        } else {
          locals.showTrueAnswer = true;
        }
      }
      if (!assessment.allow_real_time_grading) {
        locals.showGradeButton = false;
      }
      if (instance_question.allow_grade_left_ms > 0) {
        locals.disableGradeButton = true;
      }
    }

    locals.showFeedback = true;
    if (
      !variant.open ||
      (instance_question && !instance_question.open) ||
      (assessment_instance && !assessment_instance.open)
    ) {
      locals.showGradeButton = false;
      locals.showSaveButton = false;
      locals.allowAnswerEditing = false;
      if (assessment && assessment.type === 'Homework') {
        locals.showTryAgainButton = true;
        locals.showTrueAnswer = true;
      }
    }

    // Used for "auth" for external grading realtime results
    // ID is coerced to a string so that it matches what we get back from the client
    locals.variantToken = csrf.generateToken(
      { variantId: variant.id.toString() },
      config.secretKey,
    );

    if (variant.broken) {
      locals.showGradeButton = false;
      locals.showSaveButton = false;
      locals.showTryAgainButton = true;
    }

    // The method to determine if this is a manual-only question depends on the context.
    // If the question is being rendered in an assessment, we check if there are manual points and no auto points.
    // If the question is being rendered in question preview, we use the grading method as a proxy.
    if (
      assessment_question
        ? !assessment_question.max_auto_points && assessment_question.max_manual_points
        : question?.grading_method === 'Manual'
    ) {
      locals.showGradeButton = false;
    }

    if (authz_result && !authz_result.active) {
      locals.showGradeButton = false;
      locals.showSaveButton = false;
      locals.showNewVariantButton = false;
      locals.allowAnswerEditing = false;
      locals.showTryAgainButton = false;
      locals.hasAttemptsOtherVariants = false;
      locals.showTrueAnswer = true;
    }

    // Manually disable correct answer panel
    if (!question?.show_correct_answer) {
      locals.showTrueAnswer = false;
    }

    return locals;
  },

  /**
   * Render all information needed for a question.
   *
   * @param {string | null} variant_id - The variant to render, or null if it should be generated.
   * @param {string | null} variant_seed - Random seed for variant, or null if it should be generated.
   * @param {Object} locals - The current locals structure to read/write.
   * @param {function} callback - A callback(err) function.
   */
  getAndRenderVariant(variant_id, variant_seed, locals, callback) {
    async.series(
      [
        async () => {
          locals.question_course = await module.exports.getQuestionCourse(
            locals.question,
            locals.course,
          );
        },
        (callback) => {
          if (variant_id != null) {
            const params = [variant_id, locals.question.id, locals.instance_question?.id];
            sqldb.callOneRow('variants_select', params, (err, result) => {
              if (ERR(err, callback)) return;
              debug('variants_select', result.rows[0].variant);
              _.assign(locals, result.rows[0]);
              callback(null);
            });
          } else {
            const require_open = locals.assessment && locals.assessment.type !== 'Exam';
            const instance_question_id = locals.instance_question
              ? locals.instance_question.id
              : null;
            const course_instance_id =
              locals.course_instance_id ||
              (locals.course_instance && locals.course_instance.id) ||
              null;
            const options = {
              variant_seed,
            };
            const assessmentGroupWork = locals.assessment ? locals.assessment.group_work : false;
            debug('ensuringVariant')
            module.exports.ensureVariant(
              locals.question.id,
              instance_question_id,
              locals.user.user_id,
              locals.authn_user.user_id,
              assessmentGroupWork,
              course_instance_id,
              locals.course,
              locals.question_course,
              options,
              require_open,
              (err, variant) => {
                if (ERR(err, callback)) return;
                locals.variant = variant;
                callback(null);
              },
            );
          }
        },
        (callback) => {
          const { urlPrefix, variant, question, instance_question, assessment } = locals;

          const urls = module.exports._buildQuestionUrls(
            urlPrefix,
            variant,
            question,
            instance_question,
            assessment,
          );
          _.assign(locals, urls);
          callback(null);
        },
        // `_buildLocals` can throw, for instance if an instructor creates an
        // assessment instance, changes the assessment type from Homework to Exam,
        // and then views the original instance. So, we use an `async` function
        // here so that the error will be caught and propagated without us having
        // to manually catch it and pass it along via `callback`.
        async () => {
          const {
            variant,
            question,
            instance_question,
            assessment,
            assessment_instance,
            assessment_question,
            authz_result,
          } = locals;

          const newLocals = module.exports._buildLocals(
            variant,
            question,
            instance_question,
            assessment,
            assessment_instance,
            assessment_question,
            authz_result,
          );
          _.assign(locals, newLocals);
          if (locals.manualGradingInterface && question?.show_correct_answer) {
            locals.showTrueAnswer = true;
          }
        },
        async () => {
          // We only fully render a small number of submissions on initial page
          // load; the rest only require basic information like timestamps. As
          // such, we'll load submissions in two passes: we'll load basic
          // information for all submissions to this variant, and then we'll
          // load the full submission for only the submissions that we'll
          // actually render.
          const result = await sqldb.queryAsync(sql.select_basic_submissions, {
            variant_id: locals.variant.id,
            req_date: locals.req_date,
          });

          if (result.rowCount >= 1) {
            // Load detailed information for the submissions that we'll render.
            // Note that for non-Freeform questions, we unfortunately have to
            // eagerly load detailed data for all submissions, as that ends up
            // being serialized in the HTML. v2 questions don't have any easy
            // way to support async rendering of submissions.
            const needsAllSubmissions = locals.question.type !== 'Freeform';
            const submissionsToRender = needsAllSubmissions
              ? result.rows
              : result.rows.slice(0, MAX_RECENT_SUBMISSIONS);
            const detailedSubmissionResult = await sqldb.queryAsync(
              sql.select_detailed_submissions,
              {
                submission_ids: submissionsToRender.map((s) => s.id),
              },
            );

            locals.submissions = result.rows.map((s, idx) => ({
              grading_job_stats: module.exports._buildGradingJobStats(s.grading_job),
              submission_number: result.rowCount - idx,
              ...s,
              // Both queries order results consistently, so we can just use
              // the array index to match up the basic and detailed results.
              ...(idx < detailedSubmissionResult.rowCount
                ? detailedSubmissionResult.rows[idx]
                : {}),
            }));
            locals.submission = locals.submissions[0]; // most recent submission

            locals.showSubmissions = true;
            if (!locals.assessment && locals.question.show_correct_answer) {
              // instructor question pages, only show if true answer is
              // allowed by this question
              locals.showTrueAnswer = true;
            }
          }
        },
        (callback) => {
          questionServers.getEffectiveQuestionType(locals.question.type, (err, eqt) => {
            if (ERR(err, callback)) return;
            locals.effectiveQuestionType = eqt;
            callback(null);
          });
        },
        (callback) => {
          const renderSelection = {
            header: true,
            question: true,
            submissions: locals.showSubmissions,
            answer: locals.showTrueAnswer,
          };
          module.exports._render(
            renderSelection,
            locals.variant,
            locals.question,
            locals.submission,
            locals.submissions.slice(0, MAX_RECENT_SUBMISSIONS),
            locals.course,
            locals.question_course,
            locals.course_instance,
            locals,
            (err, htmls) => {
              if (ERR(err, callback)) return;
              locals.extraHeadersHtml = htmls.extraHeadersHtml;
              locals.questionHtml = htmls.questionHtml;
              locals.submissionHtmls = htmls.submissionHtmls;
              locals.answerHtml = htmls.answerHtml;
              callback(null);
            },
          );
        },
        async () => {
          // Load issues last in case there are issues from rendering.
          //
          // We'll only load the data that will be needed for this specific
          // page render. The checks here should match those in
          // `pages/partials/question.ejs`.
          const loadExtraData = locals.devMode || locals.authz_data.has_course_permission_view;
          const result = await sqldb.queryAsync(sql.select_issues, {
            variant_id: locals.variant.id,
            load_course_data: loadExtraData,
            load_system_data: loadExtraData,
          });
          locals.issues = result.rows;
        },
        async () => {
          if (locals.instance_question) {
            await manualGrading.populateRubricData(locals);
            await async.each(locals.submissions, manualGrading.populateManualGradingData);
          }
        },
        async () => {
          if (locals.question.type !== 'Freeform') {
            const questionJson = JSON.stringify({
              questionFilePath: locals.calculationQuestionFileUrl,
              questionGeneratedFilePath: locals.calculationQuestionGeneratedFileUrl,
              effectiveQuestionType: locals.effectiveQuestionType,
              course: locals.course,
              courseInstance: locals.course_instance,
              variant: {
                id: locals.variant.id,
                params: locals.variant.params,
              },
              submittedAnswer:
                locals.showSubmissions && locals.submission
                  ? locals.submission.submitted_answer
                  : null,
              feedback:
                locals.showFeedback && locals.submission ? locals.submission.feedback : null,
              trueAnswer: locals.showTrueAnswer ? locals.variant.true_answer : null,
              submissions: locals.showSubmissions ? locals.submissions : null,
            });

            const encodedJson = encodeURIComponent(questionJson);
            locals.questionJsonBase64 = Buffer.from(encodedJson).toString('base64');
          }
        },
      ],
      (err) => {
        if (ERR(err, callback)) return;
        callback(null);
      },
    );
  },

  _buildGradingJobStats(job) {
    if (job) {
      const phases = [];
<<<<<<< HEAD:lib/question.js
      const totalDuration = moment
        .duration(moment(job.grading_requested_at).diff(job.graded_at))
        .asMilliseconds();
=======
      const totalDuration = differenceInMilliseconds(
        parseISO(job.graded_at),
        parseISO(job.grading_requested_at),
      );
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
      const formatDiff = (start, end, addToPhases = true) => {
        const duration = moment.duration(moment(end).diff(start)).asMilliseconds();
        if (addToPhases) {
          const percentage = -1 * (duration / totalDuration);
          // Round down to avoid width being greater than 100% with floating point errors
          phases.push(Math.floor(percentage * 1000) / 10);
        }
        return moment.utc(duration).format('s.SSS');
      };

      return {
        submitDuration: formatDiff(job.grading_requested_at, job.grading_submitted_at),
        queueDuration: formatDiff(job.grading_submitted_at, job.grading_received_at),
        prepareDuration: formatDiff(job.grading_received_at, job.grading_started_at),
        runDuration: formatDiff(job.grading_started_at, job.grading_finished_at),
        reportDuration: formatDiff(job.grading_finished_at, job.graded_at),
        totalDuration: formatDiff(job.grading_requested_at, job.graded_at, false),
        phases,
      };
    }

    return null;
  },

  /**
   * Renders the panels that change when a grading job is completed; used to send real-time results
   * back to the client. This includes the submission panel by default, and if renderScorePanels is
   * set, also the side panels for score, navigation and the question footer.
   *
   * @param  {number}   submission_id        The id of the submission
   * @param  {number}   question_id          The id of the question (for authorization check)
   * @param  {number}   instance_question_id The id of the instance question (for authorization check)
   * @param  {number}   variant_id           The id of the variant (for authorization check)
   * @param  {String}   urlPrefix            URL prefix to be used when rendering
   * @param  {String}   questionContext      The rendering context of this question
   * @param  {String}   csrfToken            CSRF token for this question page
   * @param  {boolean}  renderScorePanels    If true, render all side panels, otherwise only the submission panel
   * @param  {Function} callback             Receives an error or an object containing the panels that were rendered
   */
  renderPanelsForSubmission(
    submission_id,
    question_id,
    instance_question_id,
    variant_id,
    urlPrefix,
    questionContext,
    csrfToken,
    authorizedEdit,
    renderScorePanels,
    callback,
  ) {
    const params = {
      submission_id,
      question_id,
      instance_question_id,
      variant_id,
    };
    sqldb.queryZeroOrOneRow(sql.select_submission_info, params, (err, results) => {
      if (ERR(err, callback)) return;
      if (results.rowCount === 0) return callback(error.make(404, 'Not found'));

      const renderSelection = {
        answer: true,
        submissions: true,
      };
      const {
        variant,
        submission,
        instance_question,
        next_instance_question,
        question,
        assessment_question,
        assessment_instance,
        assessment,
        assessment_set,
        variant_course,
        question_course,
        course_instance,
        submission_index,
        submission_count,
        grading_job,
        grading_job_id,
        grading_job_status,
        formatted_date,
      } = results.rows[0];

      const panels = {
        submissionPanel: null,
        scorePanel: null,
      };

      // Fake locals. Yay!
<<<<<<< HEAD:lib/question.js
      const locals = {};
      config.setLocals(locals);
=======
      const locals = { encoded_data: EncodedData };
      setLocalsFromConfig(locals);
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
      _.assign(
        locals,
        module.exports._buildQuestionUrls(
          urlPrefix,
          variant,
          question,
          instance_question,
          assessment,
        ),
      );
      _.assign(
        locals,
        module.exports._buildLocals(
          variant,
          question,
          instance_question,
          assessment,
          assessment_instance,
          assessment_question,
        ),
      );

      // Using util.promisify on renderFile instead of {async: true} from EJS, because the
      // latter would require all includes in EJS to be translated to await recursively.
      /** @type function */
      let renderFileAsync = util.promisify(ejs.renderFile);
      async.parallel(
        [
          async () => {
            // Render the submission panel
            submission.submission_number = submission_index;
            const submissions = [submission];

            const htmls = await util.promisify(module.exports._render)(
              renderSelection,
              variant,
              question,
              submission,
              submissions,
              variant_course,
              question_course,
              course_instance,
              locals,
            );
            submission.grading_job_id = grading_job_id;
            submission.grading_job_status = grading_job_status;
            submission.formatted_date = formatted_date;
            submission.grading_job_stats = module.exports._buildGradingJobStats(grading_job);

            panels.answerPanel = locals.showTrueAnswer ? htmls.answerHtml : null;

            await manualGrading.populateRubricData(locals);
            await manualGrading.populateManualGradingData(submission);
            const renderParams = {
              course: question_course,
              course_instance,
              question,
              submission,
              submissionHtml: htmls.submissionHtmls[0],
              submissionCount: submission_count,
              expanded: true,
              urlPrefix,
              plainUrlPrefix: config.urlPrefix,
            };
            const templatePath = path.join(__dirname, '..', 'pages', 'partials', 'submission.ejs');
            panels.submissionPanel = await renderFileAsync(templatePath, renderParams);
          },
          async () => {
            // Render the question score panel
            if (!renderScorePanels) return;

            // The score panel can and should only be rendered for
            // questions that are part of an assessment
            if (variant.instance_question_id == null) return;

            const renderParams = {
              instance_question,
              assessment_question,
              assessment_instance,
              assessment,
              variant,
              submission,
              __csrf_token: csrfToken,
              authz_result: { authorized_edit: authorizedEdit },
            };
            const templatePath = path.join(
              __dirname,
              '..',
              'pages',
              'partials',
              'questionScorePanel.ejs',
            );
            panels.questionScorePanel = await renderFileAsync(templatePath, renderParams);
          },
          async () => {
            // Render the assessment score panel
            if (!renderScorePanels) return;

            // As usual, only render if this variant is part of an assessment
            if (variant.instance_question_id == null) return;

            const renderParams = {
              assessment_instance,
              assessment,
              assessment_set,
              urlPrefix,
            };

            const templatePath = path.join(
              __dirname,
              '..',
              'pages',
              'partials',
              'assessmentScorePanel.ejs',
            );
            panels.assessmentScorePanel = await renderFileAsync(templatePath, renderParams);
          },
          async () => {
            // Render the question panel footer
            if (!renderScorePanels) return;

            const renderParams = {
              variant,
              question,
              assessment_question,
              instance_question,
              question_context: questionContext,
              __csrf_token: csrfToken,
              authz_result: { authorized_edit: authorizedEdit },
            };
            _.assign(renderParams, locals);

            const templatePath = path.join(
              __dirname,
              '..',
              'pages',
              'partials',
              'questionFooter.ejs',
            );
            panels.questionPanelFooter = await renderFileAsync(templatePath, renderParams);
          },
          async () => {
            if (!renderScorePanels) return;

            // only render if variant is part of assessment
            if (variant.instance_question_id == null) return;

            // Render the next question nav link
            // NOTE: This must be kept in sync with the corresponding code in
            // `pages/partials/questionNavSideButtonGroup.ejs`.
            const renderParams = {
              question: next_instance_question,
              advance_score_perc: assessment_question.advance_score_perc,
              button: {
                id: 'question-nav-next',
                label: 'Next question',
              },
            };
            _.assign(renderParams, locals);
            renderParams.urlPrefix = urlPrefix; // needed to get urlPrefix for the course instance, not the site

            const templatePath = path.join(
              __dirname,
              '..',
              'pages',
              'partials',
              'questionNavSideButton.ejs',
            );
            panels.questionNavNextButton = await renderFileAsync(templatePath, renderParams);
          },
        ],
        (err) => {
          if (ERR(err, callback)) return;
          callback(null, panels);
        },
      );
    });
  },
<<<<<<< HEAD:lib/question.js
};
=======

  /**
   * Expose the renderer in use to the client so that we can easily see
   * which renderer was used for a given request.
   *
   * @param {import('express').Response} res
   */
  setRendererHeader(res) {
    const renderer = res.locals.question_renderer;
    if (renderer) {
      res.set('X-PrairieLearn-Question-Renderer', renderer);
    }
  },
};
>>>>>>> d53b2607cedbb93869bdca019f404bfd3c03efb7:apps/prairielearn/src/lib/question.js
