import root from '../../../../apps/web/messages/id.json';
import common_id from '../../../../apps/web/messages/demos/id/common.json';
import personResult_id from '../../../../apps/web/messages/demos/id/personResult.json';
import alreadyEnrolled_id from '../../../../apps/web/messages/demos/id/alreadyEnrolled.json';
import searchPersonResult_id from '../../../../apps/web/messages/demos/id/searchPersonResult.json';
import searchLivePersonResult_id from '../../../../apps/web/messages/demos/id/searchLivePersonResult.json';
import searchActiveUserResult_id from '../../../../apps/web/messages/demos/id/searchActiveUserResult.json';
import humanIdPreviewResult_id from '../../../../apps/web/messages/demos/id/humanIdPreviewResult.json';
import humanIdDecryptResult_id from '../../../../apps/web/messages/demos/id/humanIdDecryptResult.json';
import humanIdStructuredResult_id from '../../../../apps/web/messages/demos/id/humanIdStructuredResult.json';
import createCollection_id from '../../../../apps/web/messages/demos/id/createCollection.json';
import createPerson_id from '../../../../apps/web/messages/demos/id/createPerson.json';
import createPersonWithLiveness_id from '../../../../apps/web/messages/demos/id/createPersonWithLiveness.json';
import updatePerson_id from '../../../../apps/web/messages/demos/id/updatePerson.json';
import deletePerson_id from '../../../../apps/web/messages/demos/id/deletePerson.json';
import searchPerson_id from '../../../../apps/web/messages/demos/id/searchPerson.json';
import searchLivePerson_id from '../../../../apps/web/messages/demos/id/searchLivePerson.json';
import searchActiveUser_id from '../../../../apps/web/messages/demos/id/searchActiveUser.json';
import searchCrops_id from '../../../../apps/web/messages/demos/id/searchCrops.json';
import detectFace_id from '../../../../apps/web/messages/demos/id/detectFace.json';
import faceComparison_id from '../../../../apps/web/messages/demos/id/faceComparison.json';
import faceComparisonLiveness_id from '../../../../apps/web/messages/demos/id/faceComparisonLiveness.json';
import verifyFace_id from '../../../../apps/web/messages/demos/id/verifyFace.json';
import liveness_id from '../../../../apps/web/messages/demos/id/liveness.json';
import humanid_id from '../../../../apps/web/messages/demos/id/humanid.json';
import humanidCreate_id from '../../../../apps/web/messages/demos/id/humanidCreate.json';
import humanidCreateQr_id from '../../../../apps/web/messages/demos/id/humanidCreateQr.json';
import humanidDecrypt_id from '../../../../apps/web/messages/demos/id/humanidDecrypt.json';
import humanidPreview_id from '../../../../apps/web/messages/demos/id/humanidPreview.json';
import faceDetection_id from '../../../../apps/web/messages/demos/id/faceDetection.json';

const messages = {
  ...root,
  demos: {
    common: common_id,
    personResult: personResult_id,
    alreadyEnrolled: alreadyEnrolled_id,
    searchPersonResult: searchPersonResult_id,
    searchLivePersonResult: searchLivePersonResult_id,
    searchActiveUserResult: searchActiveUserResult_id,
    humanIdPreviewResult: humanIdPreviewResult_id,
    humanIdDecryptResult: humanIdDecryptResult_id,
    humanIdStructuredResult: humanIdStructuredResult_id,
    createCollection: createCollection_id,
    createPerson: createPerson_id,
    createPersonWithLiveness: createPersonWithLiveness_id,
    updatePerson: updatePerson_id,
    deletePerson: deletePerson_id,
    searchPerson: searchPerson_id,
    searchLivePerson: searchLivePerson_id,
    searchActiveUser: searchActiveUser_id,
    searchCrops: searchCrops_id,
    detectFace: detectFace_id,
    faceComparison: faceComparison_id,
    faceComparisonLiveness: faceComparisonLiveness_id,
    verifyFace: verifyFace_id,
    liveness: liveness_id,
    humanid: humanid_id,
    humanidCreate: humanidCreate_id,
    humanidCreateQr: humanidCreateQr_id,
    humanidDecrypt: humanidDecrypt_id,
    humanidPreview: humanidPreview_id,
    faceDetection: faceDetection_id,
  },
};

export default messages;
