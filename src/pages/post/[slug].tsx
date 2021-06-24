/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';

import Link from 'next/link';

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
  last_publication_date: string | null;
  uid?: string;
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
  preview: boolean;
  previousPost: Post;
  nextPost: Post;
}

export default function Post({
  post,
  preview,
  previousPost,
  nextPost,
}: PostProps): JSX.Element {
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
        <div className={commonStyles.postInfoMainContainer}>
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
            <span className={commonStyles.postInfoText}>
              {post.data.author}
            </span>
            <FiClock color="#BBBBBB" />
            <span className={commonStyles.postInfoText}>
              {estimatedTime} min
            </span>
          </div>
          {post.last_publication_date !== post.first_publication_date && (
            <div>
              <span className={commonStyles.editedText}>
                {`*editado em ${format(
                  new Date(post.last_publication_date),
                  'dd MMM yyyy',
                  {}
                ).toLowerCase()}, às ${format(
                  new Date(post.last_publication_date),
                  'HH:mm',
                  {}
                )}`}
              </span>
            </div>
          )}
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

        <div className={styles.divider} />

        <div className={styles.postNavigationContainer}>
          {previousPost ? (
            <Link href={`/post/${previousPost?.uid}`}>
              <div className={styles.leftLabel}>
                <span>{previousPost?.data.title}</span>
                <span>Post anterior</span>
              </div>
            </Link>
          ) : (
            <div className={styles.leftLabel} />
          )}
          {nextPost && nextPost.uid !== post.uid ? (
            <Link href={`/post/${nextPost?.uid}`}>
              <div className={styles.rightLabel}>
                <span>{nextPost.data.title}</span>
                <span className="nextPost-label">Próximo post</span>
              </div>
            </Link>
          ) : (
            <div className={styles.rightLabel} />
          )}
        </div>

        <Comment />
      </main>
      {preview && (
        <aside className={commonStyles.previewButton}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
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

  const { params, preview, previewData } = context;

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPost = await prismic.query(
    [
      Prismic.predicates.dateBefore(
        'document.first_publication_date',
        format(new Date(response.first_publication_date), 'yyyy-MM-dd', {})
      ),
    ],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const nextPost = await prismic.query(
    [
      Prismic.predicates.dateAfter(
        'document.first_publication_date',
        format(new Date(response.first_publication_date), 'yyyy-MM-dd', {})
      ),
    ],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  // console.log('previous post: ', JSON.stringify(previousPost, null, 2));
  // console.log('next post: ', JSON.stringify(nextPost, null, 2));

  // console.log(JSON.stringify(response.data, null, 2));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data?.banner?.url,
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
    props: {
      post,
      preview: preview || false,
      previousPost: previousPost?.results[0] ?? null,
      nextPost: nextPost?.results[0] ?? null,
    },
    revalidate: 60,
  };
};
