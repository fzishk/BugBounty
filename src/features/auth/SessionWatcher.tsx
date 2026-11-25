import { useEffect, useRef } from 'react';
import { useGetMeQuery } from '../../api/bazaarApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toastShown } from '../toast/toastSlice';
import { selectSession } from './sessionSlice';

/**
 * - On load, checks a saved token with GET /api/me (a 401 clears it via the base query).
 * - Tells the user when their session expires, wherever they are in the app.
 */
export function SessionWatcher() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  useGetMeQuery(undefined, { skip: session.status !== 'signed-in' });

  const previous = useRef(session.status);
  useEffect(() => {
    if (
      previous.current === 'signed-in' &&
      session.status === 'signed-out' &&
      session.reason === 'expired'
    ) {
      dispatch(toastShown('info', 'Your session expired. Please sign in again.'));
    }
    previous.current = session.status;
  }, [dispatch, session]);

  return null;
}
