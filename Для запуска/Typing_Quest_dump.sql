--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievements (
    achievement_id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text NOT NULL,
    condition_text text NOT NULL,
    condition_type character varying(50) NOT NULL,
    condition_value integer NOT NULL,
    icon_path character varying(255)
);


ALTER TABLE public.achievements OWNER TO postgres;

--
-- Name: achievements_achievement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.achievements_achievement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_achievement_id_seq OWNER TO postgres;

--
-- Name: achievements_achievement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.achievements_achievement_id_seq OWNED BY public.achievements.achievement_id;


--
-- Name: levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.levels (
    level_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    difficulty integer,
    time_limit integer NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.levels OWNER TO postgres;

--
-- Name: levels_level_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.levels_level_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.levels_level_id_seq OWNER TO postgres;

--
-- Name: levels_level_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.levels_level_id_seq OWNED BY public.levels.level_id;


--
-- Name: results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.results (
    result_id integer NOT NULL,
    user_id integer,
    level_id integer,
    cpm numeric(5,2) NOT NULL,
    accuracy numeric(5,2) NOT NULL,
    completion_time numeric(8,3) NOT NULL,
    errors_count integer NOT NULL,
    score numeric(10,2) NOT NULL,
    achieved_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.results OWNER TO postgres;

--
-- Name: results_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.results_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.results_result_id_seq OWNER TO postgres;

--
-- Name: results_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.results_result_id_seq OWNED BY public.results.result_id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_achievements (
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now() NOT NULL,
    "userUserId" integer,
    "achievementAchievementId" integer
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id uuid NOT NULL,
    user_id integer NOT NULL,
    refresh_token_hash character varying(512) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: achievements achievement_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements ALTER COLUMN achievement_id SET DEFAULT nextval('public.achievements_achievement_id_seq'::regclass);


--
-- Name: levels level_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels ALTER COLUMN level_id SET DEFAULT nextval('public.levels_level_id_seq'::regclass);


--
-- Name: results result_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results ALTER COLUMN result_id SET DEFAULT nextval('public.results_result_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.achievements (achievement_id, title, description, condition_text, condition_type, condition_value, icon_path) FROM stdin;
1	Первые шаги	Пройдите свой первый уровень	Пройдите 1 уровень	level_completed	1	/icons/first_steps.png
2	Демон скорости	Достигните скорости 100 CPM в любом уровне	Достигните 100 CPM в любом уровне	cpm	100	/icons/speed_demon.png
3	Мастер точности	Достигните точности 95%	Достигните 95% точности	accuracy	95	/icons/accuracy_master.png
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (level_id, name, description, difficulty, time_limit, data, created_at) FROM stdin;
1	Первый уровень	Стартовый уровень чтобы начать	1	3	{"ru": "фываолдж", "eng": "asdfhjkl", "levelId": "Level_1", "enemyTypes": [{"type": "mushroom", "speed": 50, "gravity": 800, "bodyWidth": 40, "animations": {"hit": {"repeat": -1, "texture": "Mushroom-Hit.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Mushroom-Idle.png", "endFrame": 6, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Mushroom-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Mushroom-Attack.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 34, "frameWidth": 80, "frameHeight": 64, "patrolDistance": 100}, {"type": "bat", "speed": 80, "gravity": 800, "bodyWidth": 32, "animations": {"hit": {"repeat": -1, "texture": "Bat-hurt.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Bat-IdleFly.png", "endFrame": 8, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Bat-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Bat-Attack2.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 32, "frameWidth": 64, "frameHeight": 64, "patrolDistance": 100}], "x_position": 800, "y_position": 900}	2023-01-01 00:00:00
2	Второй уровень	Более сложный уровень, подойдет для опытных	3	4	{"ru": "фывапролджэ", "eng": "asdfghjkl", "levelId": "Level_2", "enemyTypes": [{"type": "mushroom", "speed": 100, "gravity": 800, "bodyWidth": 40, "animations": {"hit": {"repeat": -1, "texture": "Mushroom-Hit.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Mushroom-Idle.png", "endFrame": 6, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Mushroom-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Mushroom-Attack.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 34, "frameWidth": 80, "frameHeight": 64, "patrolDistance": 100}, {"type": "bat", "speed": 150, "gravity": 800, "bodyWidth": 32, "animations": {"hit": {"repeat": -1, "texture": "Bat-hurt.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Bat-IdleFly.png", "endFrame": 8, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Bat-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Bat-Attack2.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 32, "frameWidth": 64, "frameHeight": 64, "patrolDistance": 100}], "x_position": 730, "y_position": 820}	2023-01-01 00:00:00
3	Третий уровень	Сложный уровень, новичкам будет тяжело	5	5	{"ru": "йцукенгшщзхъфывапролджэячсмитьбю", "eng": "qwertyuiopasdfghjklzxcvbnm", "levelId": "Level_3", "enemyTypes": [{"type": "mushroom", "speed": 100, "gravity": 800, "bodyWidth": 40, "animations": {"hit": {"repeat": -1, "texture": "Mushroom-Hit.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Mushroom-Idle.png", "endFrame": 6, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Mushroom-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Mushroom-Attack.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 34, "frameWidth": 80, "frameHeight": 64, "patrolDistance": 100}, {"type": "bat", "speed": 150, "gravity": 800, "bodyWidth": 32, "animations": {"hit": {"repeat": -1, "texture": "Bat-hurt.png", "endFrame": 4, "frameRate": 8, "startFrame": 0}, "idle": {"repeat": -1, "texture": "Bat-IdleFly.png", "endFrame": 8, "frameRate": 10, "startFrame": 0}, "walk": {"repeat": -1, "texture": "Bat-Run.png", "endFrame": 7, "frameRate": 10, "startFrame": 0}, "attack": {"repeat": -1, "texture": "Bat-Attack2.png", "endFrame": 12, "frameRate": 18, "startFrame": 0}}, "bodyHeight": 32, "frameWidth": 64, "frameHeight": 64, "patrolDistance": 100}], "x_position": 900, "y_position": 750}	2023-01-01 00:00:00
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.results (result_id, user_id, level_id, cpm, accuracy, completion_time, errors_count, score, achieved_at) FROM stdin;
14	8	1	100.20	91.90	65.462	9	106.00	2025-06-06 08:45:15.273337
15	8	1	85.20	83.20	83.099	18	19.00	2025-06-06 12:53:53.396124
16	8	1	49.30	74.10	129.847	30	0.00	2025-06-06 12:56:22.972548
17	8	1	57.40	87.50	89.871	12	15.00	2025-06-06 12:58:14.900717
18	8	1	106.50	83.50	52.534	18	62.00	2025-06-06 12:59:42.17817
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_achievements (user_id, achievement_id, unlocked_at, "userUserId", "achievementAchievementId") FROM stdin;
4	1	2025-06-06 04:57:43.488	\N	\N
8	1	2025-06-06 12:53:53.418	\N	\N
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, user_id, refresh_token_hash, created_at, expires_at) FROM stdin;
6c6b00b7-6645-4206-9925-a1dd5ab4099a	8	$2b$10$tLwVzHAvXgR4dEhAVH9S6.vDGA9zwEp1H1Q/TL9VWVF4EWzwchJPO	2025-06-07 16:57:48.360272	2025-07-07 16:57:48.356
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, password_hash, created_at, last_login) FROM stdin;
8	Вячеслав	ivan@mail.ru	$2b$10$vlJp8cgsckYlikvmGf/CSOL6ESCDabEqPa6DqarRXf.AOyZ5vDZjC	2025-06-06 08:34:16.032505	2025-06-07 15:26:17.921
\.


--
-- Name: achievements_achievement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.achievements_achievement_id_seq', 4, true);


--
-- Name: levels_level_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_level_id_seq', 3, true);


--
-- Name: results_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.results_result_id_seq', 18, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (achievement_id);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (level_id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (result_id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id, achievement_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: results FK_08b8f644e3b243fe8cb8c7498e8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT "FK_08b8f644e3b243fe8cb8c7498e8" FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_achievements FK_1a2e2126268d16f069e537282fa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT "FK_1a2e2126268d16f069e537282fa" FOREIGN KEY ("achievementAchievementId") REFERENCES public.achievements(achievement_id);


--
-- Name: results FK_37976280e76b19fcc48e405d075; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT "FK_37976280e76b19fcc48e405d075" FOREIGN KEY (level_id) REFERENCES public.levels(level_id);


--
-- Name: user_achievements FK_e3b565450cd56a821365ccff1f2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT "FK_e3b565450cd56a821365ccff1f2" FOREIGN KEY ("userUserId") REFERENCES public.users(user_id);


--
-- Name: user_sessions FK_e9658e959c490b0a634dfc54783; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

