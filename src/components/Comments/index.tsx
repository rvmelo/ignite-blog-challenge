import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

const Comments = (): JSX.Element => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};

export default Comments;
