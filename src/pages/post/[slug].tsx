/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';

import { useRouter } from 'next/router';

import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import Comment from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  // TODO

  const router = useRouter();

  const estimatedTime = useMemo(() => {
    if (!post) return 0;

    const totalWords = post?.data.content.reduce((words, content) => {
      const heading = content.heading.split(' ');
      const body = RichText.asText(content.body).split(' ');

      words += heading.length + body.length;

      return words;
    }, 0);

    return Math.ceil(totalWords / 200);
  }, [post]);

  return !router.isFallback ? (
    <div className={styles.container}>
      <img
        className={styles.bannerImg}
        src={post.data.banner.url}
        alt="banner"
      />
      <main className={styles.main}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={commonStyles.postInfoContainer}>
          <FiCalendar color="#BBBBBB" />
          <span className={commonStyles.postInfoText}>
            {format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {}
            ).toLowerCase()}
          </span>
          <FiUser color="#BBBBBB" />
          <span className={commonStyles.postInfoText}>{post.data.author}</span>
          <FiClock color="#BBBBBB" />
          <span className={commonStyles.postInfoText}>{estimatedTime} min</span>
        </div>

        {post.data.content.map(content => (
          <div key={content.heading}>
            <div className={styles.contentHeading}>
              <span>{content.heading}</span>
            </div>
            <div
              className={commonStyles.postText}
              dangerouslySetInnerHTML={{
                __html: String(RichText.asHtml(content.body)),
              }}
            />
          </div>
        ))}
        <Comment />
      </main>
    </div>
  ) : (
    <div className={styles.loadingContainer}>
      <h1 className={styles.title}>Carregando...</h1>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'post.content'],
      pageSize: 100,
    }
  );

  // TODO
  return {
    paths: posts.results.map(post => ({
      params: {
        slug: post.uid,
      },
    })),

    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const { params } = context;

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  // console.log(JSON.stringify(response.data, null, 2));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  // TODO
  return {
    props: { post },
  };
};
