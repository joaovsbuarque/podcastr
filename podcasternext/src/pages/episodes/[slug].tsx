import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

import { api } from '../../services/api';
import { convertDurantionToTimeString } from '../../utils/convertDurationToTimeString';

import  styles from './episode.module.scss'

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    members: string;
    duration: number;
    durationAsString: string;
    url: string;
    publishedAt: string;
    description: string;
}

type EpisodeProps = {
    episode: Episode;
}

export default function Episode({ episode }: EpisodeProps) {
    
    const { play }  = usePlayer();

    const router = useRouter();
    
    if (router.isFallback) {
        return <p>Carregando...</p>
    }

    return (
        <div className={styles.episode}>

        <Head>
            <title>{episode.title}</title>
        </Head>

            <div className={styles.thumbnailContainer}>
                <Link href="/">
                    <button type="button">
                        <img src="/arrow-left.svg" alt=""/>
                    </button>
                </Link>
                <Image 
                width={700}
                height={160}
                src={episode.thumbnail}
                objectFit="cover"
                />
                <button type="button" onClick={() => play(episode)}>
                    <img src="/play.svg" alt=""/>
                </button>
            </div>

            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>

            <div 
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: episode.description}}
            />

        </div>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    const { data } = await api.get('episodes', {
        params: {
            _limit: 12, 
            _sort: 'published_at',
            _order: 'desc',
        }
    })

    const paths = data.map(episode => {
        return {
            params: {
                slug: episode.id
            }
        }
    })
    
    return {
        paths,
        fallback: 'blocking'
    }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
    const { slug } = ctx.params;
    
    const { data } = await api.get(`/episodes/${slug}`)
    
    const episode = {
        id:data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
        duration: Number(data.file.duration),
        durationAsString: convertDurantionToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url,
    
    }

    return {
        props: {
            episode,
        },
        revalidate: 60 * 60 * 24 //carrega a cada 24 horas
    }
}