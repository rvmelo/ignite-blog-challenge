import { useState } from 'react';

import { GetStaticProps } from 'next';

import { format } from 'date-fns';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';

import Prismic from '@prismicio/client';
import { useEffect, useCallback } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  uid: string;
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): React.ReactNode {
  // TODO

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPageLink, setNextPageLink] = useState('');

  const handlePostRequest = useCallback(async () => {
    fetch(nextPageLink)
      .then(response => response.json())
      .then(data => {
        setNextPageLink(data.next_page);

        const newPosts = data?.results.map((post, index) => ({
          ...post,
          uid: data.results[index].uid,
          first_publication_date: new Date(
            post.first_publication_date
          ).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        }));

        setPosts(prev => [...prev, ...newPosts]);
      });
  }, [nextPageLink]);

  useEffect(() => {
    setPosts(
      postsPagination?.results.map((post, index) => ({
        ...post,
        uid: postsPagination.results[index].uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {}
        ).toLowerCase(),
      }))
    );

    setNextPageLink(postsPagination.next_page);
  }, [postsPagination, setNextPageLink]);

  return (
    <div className={styles.container}>
      {posts?.map(post => (
        <Link href={`post/${post.uid}`} key={post.uid}>
          <a>
            <div className={styles.postContainer}>
              <h1 className={styles.postTitle}>{post.data.title}</h1>
              <h1 className={commonStyles.postText}>{post.data.subtitle}</h1>
              <div>
                <div className={commonStyles.postInfoContainer}>
                  <FiCalendar color="#BBBBBB" />
                  <span className={commonStyles.postInfoText}>
                    {post.first_publication_date}
                  </span>
                  <FiUser color="#BBBBBB" />
                  <span className={commonStyles.postInfoText}>
                    {post.data.author}
                  </span>
                </div>
              </div>
            </div>
          </a>
        </Link>
      ))}
      {nextPageLink && (
        <button
          className={styles.loadMoreTextButton}
          onClick={handlePostRequest}
          type="button"
        >
          <span>Carregar mais posts</span>
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  // TODO
  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
