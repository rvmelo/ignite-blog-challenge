/* eslint-disable react/no-unused-prop-types */
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
  preview: boolean;
  previewData: {
    ref: string;
  };
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): React.ReactNode {
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
    <div className={styles.mainContainer}>
      <div className={styles.container}>
        {posts?.map(post => (
          <div className={styles.postContainer} key={post.uid}>
            <Link href={`post/${post.uid}`}>
              <a>
                <div>
                  <h1 className={styles.postTitle}>{post.data.title}</h1>
                  <h1 className={commonStyles.postText}>
                    {post.data.subtitle}
                  </h1>
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
          </div>
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
      {preview && (
        <aside className={commonStyles.previewButton}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  previewData,
  preview = false,
}: HomeProps) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  // TODO
  return {
    props: {
      postsPagination: postsResponse,
      preview,
    },
  };
};
