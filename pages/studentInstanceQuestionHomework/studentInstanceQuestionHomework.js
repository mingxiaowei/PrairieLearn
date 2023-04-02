import { callbackify } from 'util';
import ERR from 'async-stacktrace';
import { omit } from 'lodash';
import { Router } from 'express';
const router = Router();

import { make } from '@prairielearn/error';
const logPageView = require('../../middlewares/logPageView')('studentInstanceQuestion');
import { saveAndGradeSubmission, saveSubmission, renderPanelsForSubmission, getAndRenderVariant } from '../../lib/question';
import { processFileUpload, processTextUpload, processDeleteFile, processIssue } from '../shared/studentInstanceQuestion';
import { callOneRow } from '@prairielearn/postgres';

function processSubmission(req, res, callback) {
  if (!res.locals.authz_result.active) {
    return callback(make(400, 'This assessment is not accepting submissions at this time.'));
  }
  let variant_id, submitted_answer;
  if (res.locals.question.type === 'Freeform') {
    variant_id = req.body.__variant_id;
    submitted_answer = omit(req.body, ['__action', '__csrf_token', '__variant_id']);
  } else {
    if (!req.body.postData) {
      return callback(make(400, 'No postData', { locals: res.locals, body: req.body }));
    }
    let postData;
    try {
      postData = JSON.parse(req.body.postData);
    } catch (e) {
      return callback(
        make(400, 'JSON parse failed on body.postData', {
          locals: res.locals,
          body: req.body,
        })
      );
    }
    variant_id = postData.variant ? postData.variant.id : null;
    submitted_answer = postData.submittedAnswer;
  }
  const submission = {
    variant_id: variant_id,
    auth_user_id: res.locals.authn_user.user_id,
    submitted_answer: submitted_answer,
    credit: res.locals.authz_result.credit,
    mode: res.locals.authz_data.mode,
  };
  callOneRow(
    'variants_ensure_instance_question',
    [submission.variant_id, res.locals.instance_question.id],
    (err, result) => {
      if (ERR(err, callback)) return;
      const variant = result.rows[0];
      if (req.body.__action === 'grade') {
        const overrideRateLimits = false;
        saveAndGradeSubmission(
          submission,
          variant,
          res.locals.question,
          res.locals.course,
          overrideRateLimits,
          (err) => {
            if (ERR(err, callback)) return;
            callback(null, submission.variant_id);
          }
        );
      } else if (req.body.__action === 'save') {
        saveSubmission(
          submission,
          variant,
          res.locals.question,
          res.locals.course,
          (err) => {
            if (ERR(err, callback)) return;
            callback(null, submission.variant_id);
          }
        );
      } else {
        callback(
          make(400, 'unknown __action', {
            locals: res.locals,
            body: req.body,
          })
        );
      }
    }
  );
}

router.post('/', function (req, res, next) {
  if (res.locals.assessment.type !== 'Homework') return next();

  if (!res.locals.authz_result.authorized_edit) {
    return next(make(403, 'Not authorized', res.locals));
  }

  if (req.body.__action === 'grade' || req.body.__action === 'save') {
    processSubmission(req, res, function (err, variant_id) {
      if (ERR(err, next)) return;
      res.redirect(
        res.locals.urlPrefix +
          '/instance_question/' +
          res.locals.instance_question.id +
          '/?variant_id=' +
          variant_id
      );
    });
  } else if (req.body.__action === 'attach_file') {
    callbackify(processFileUpload)(
      req,
      res,
      function (err, variant_id) {
        if (ERR(err, next)) return;
        res.redirect(
          res.locals.urlPrefix +
            '/instance_question/' +
            res.locals.instance_question.id +
            '/?variant_id=' +
            variant_id
        );
      }
    );
  } else if (req.body.__action === 'attach_text') {
    callbackify(processTextUpload)(
      req,
      res,
      function (err, variant_id) {
        if (ERR(err, next)) return;
        res.redirect(
          res.locals.urlPrefix +
            '/instance_question/' +
            res.locals.instance_question.id +
            '/?variant_id=' +
            variant_id
        );
      }
    );
  } else if (req.body.__action === 'delete_file') {
    callbackify(processDeleteFile)(
      req,
      res,
      function (err, variant_id) {
        if (ERR(err, next)) return;
        res.redirect(
          res.locals.urlPrefix +
            '/instance_question/' +
            res.locals.instance_question.id +
            '/?variant_id=' +
            variant_id
        );
      }
    );
  } else if (req.body.__action === 'report_issue') {
    callbackify(processIssue)(req, res, function (err, variant_id) {
      if (ERR(err, next)) return;
      res.redirect(
        res.locals.urlPrefix +
          '/instance_question/' +
          res.locals.instance_question.id +
          '/?variant_id=' +
          variant_id
      );
    });
  } else {
    next(
      make(400, 'unknown __action: ' + req.body.__action, {
        locals: res.locals,
        body: req.body,
      })
    );
  }
});

router.get('/variant/:variant_id/submission/:submission_id', function (req, res, next) {
  renderPanelsForSubmission(
    req.params.submission_id,
    res.locals.question.id,
    res.locals.instance_question.id,
    req.params.variant_id,
    res.locals.urlPrefix,
    null, // questionContext
    null, // csrfToken
    null, // authorizedEdit
    false, // renderScorePanels
    (err, results) => {
      if (ERR(err, next)) return;
      res.send({ submissionPanel: results.submissionPanel });
    }
  );
});

router.get('/', function (req, res, next) {
  if (res.locals.assessment.type !== 'Homework') return next();
  getAndRenderVariant(req.query.variant_id, null, res.locals, function (err) {
    if (ERR(err, next)) return;
    logPageView(req, res, (err) => {
      if (ERR(err, next)) return;
      res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    });
  });
});

export default router;
