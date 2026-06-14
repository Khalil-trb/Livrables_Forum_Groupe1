# Forum JS-D-K

Application de forum en **Node.js**, **Express** et **MySQL**, avec une interface frontend statique servie directement par le serveur.

## Fonctionnalites

- Authentification JWT : inscription, connexion et session utilisateur
- Fils de discussion avec categories, tags et images
- Commentaires imbriques avec reponses
- Votes positifs et negatifs sur les discussions et commentaires
- Profils publics et modification du profil personnel
- Systeme d'amis : recherche, demandes, acceptation et suppression
- Signalements de contenus
- Moderation par roles : `user`, `moderator`, `admin`
- Epingle / verrouillage des discussions pour la moderation
- Bannissement et gestion des roles par les administrateurs

## Technologies

- **Backend** : Node.js, Express
- **Base de donnees** : MySQL avec `mysql2`
- **Authentification** : JWT, bcrypt
- **Frontend** : HTML, CSS, JavaScript
- **Developpement** : nodemon

## Installation

### 1. Installer les dependances

```bash
npm install
```

### 2. Configurer l'environnement

Copiez le fichier d'exemple, puis adaptez les valeurs a votre installation MySQL.

```bash
cp .env.example .env
```

Variables principales :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=forum_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Creer la base de donnees

```bash
mysql -u root -p < schema.sql
```

Si votre base existe deja et que vous devez appliquer uniquement les ajouts recents, utilisez le fichier :

```bash
mysql -u root -p forum_db < migration.sql
```

### 4. Lancer le serveur

```bash
npm run dev
```

Pour un lancement sans nodemon :

```bash
npm start
```

L'application est ensuite disponible sur :

- Frontend : `http://localhost:3000`
- API : `http://localhost:3000/api`
- Health check : `http://localhost:3000/health`

## Scripts npm

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur avec nodemon |
| `npm start` | Lance le serveur avec Node.js |
| `npm test` | Affiche le message de test actuel |

## Structure du projet

```text
.
|-- Frontend/              # Interface HTML, CSS, JavaScript et images
|-- src/
|   |-- config/            # Configuration MySQL
|   |-- controllers/       # Logique metier des routes API
|   |-- middleware/        # Authentification et autorisations
|   `-- routes/            # Definition des endpoints API
|-- index.js               # Point d'entree Express
|-- schema.sql             # Schema complet de la base
|-- migration.sql          # Migration supplementaire
`-- README.md
```

## Reference API

URL de base : `http://localhost:3000/api`

### Authentification

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Non | Inscrire un utilisateur |
| `POST` | `/auth/login` | Non | Connecter un utilisateur et recevoir un JWT |
| `GET` | `/auth/me` | Oui | Recuperer l'utilisateur connecte |

### Profil

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/profile/me` | Oui | Recuperer son profil |
| `PUT` | `/profile/me` | Oui | Modifier son profil |
| `GET` | `/users/:id/profile` | Optionnelle | Voir un profil public |

### Amis

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/users/search` | Oui | Rechercher des utilisateurs |
| `GET` | `/friends` | Oui | Lister ses amis |
| `GET` | `/friends/requests` | Oui | Lister les demandes d'amis |
| `POST` | `/friends/requests` | Oui | Envoyer une demande d'ami |
| `PATCH` | `/friends/requests/:id` | Oui | Accepter ou refuser une demande |
| `DELETE` | `/friends/requests/:id` | Oui | Annuler une demande envoyee |
| `DELETE` | `/friends/:userId` | Oui | Supprimer un ami |

### Discussions

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/threads` | Optionnelle | Lister les discussions avec filtres : `?category=&tag=&search=&page=&limit=` |
| `GET` | `/threads/:slug` | Optionnelle | Recuperer une discussion |
| `POST` | `/threads` | Oui | Creer une discussion |
| `PUT` | `/threads/:id` | Oui | Modifier une discussion |
| `DELETE` | `/threads/:id` | Oui | Supprimer une discussion |

### Commentaires

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/threads/:threadId/comments` | Optionnelle | Lister les commentaires imbriques d'une discussion |
| `POST` | `/threads/:threadId/comments` | Oui | Publier un commentaire ou une reponse avec `parent_id` |
| `PUT` | `/comments/:id` | Oui | Modifier un commentaire |
| `DELETE` | `/comments/:id` | Oui | Supprimer un commentaire |

### Votes

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/vote` | Oui | Voter sur une discussion ou un commentaire |

### Categories et tags

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/categories` | Non | Lister les categories |
| `POST` | `/categories` | Admin | Creer une categorie |
| `DELETE` | `/categories/:id` | Admin | Supprimer une categorie |
| `GET` | `/tags` | Non | Lister les tags |
| `POST` | `/tags` | Oui | Creer un tag |

### Signalements

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/reports` | Oui | Creer un signalement |
| `GET` | `/admin/reports` | Admin | Lister les signalements |
| `PATCH` | `/admin/reports/:id` | Admin | Mettre a jour le statut d'un signalement |

### Moderation

| Methode | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/admin/users` | Admin | Lister les utilisateurs |
| `GET` | `/admin/threads` | Admin | Lister les discussions pour l'administration |
| `GET` | `/admin/comments` | Admin | Lister les commentaires pour l'administration |
| `PATCH` | `/admin/users/:id/ban` | Admin | Bannir ou debannir un utilisateur |
| `PATCH` | `/admin/users/:id/role` | Admin | Modifier le role d'un utilisateur |
| `PATCH` | `/admin/threads/:id/pin` | Admin / Moderator | Epingler ou desenpingler une discussion |
| `PATCH` | `/admin/threads/:id/lock` | Admin / Moderator | Verrouiller ou deverrouiller une discussion |

## Authentification

Les routes protegees utilisent un token Bearer dans l'en-tete `Authorization`.

```http
Authorization: Bearer <votre_token_jwt>
```

## Exemples de requetes

### Inscription

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Creation d'une discussion

```http
POST /api/threads
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

```json
{
  "title": "Comment apprendre Node.js ?",
  "content": "Je cherche de bonnes ressources pour progresser.",
  "image_url": "https://example.com/image.png",
  "category_id": 1,
  "tags": [2, 5]
}
```

### Reponse a un commentaire

```http
POST /api/threads/42/comments
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

```json
{
  "content": "Bonne question, voici une piste.",
  "image_url": "https://example.com/reponse.png",
  "parent_id": 10
}
```

### Vote

```http
POST /api/vote
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

```json
{
  "target_type": "thread",
  "target_id": 7,
  "value": 1
}
```

## Deroulement du projet

### Decoupage

Le projet a d'abord ete construit autour d'une base simple : un backend Express, une base MySQL et un frontend connecte. Les fonctionnalites ont ensuite ete ajoutees progressivement en suivant le cahier des charges : authentification, discussions, commentaires, votes, moderation, puis fonctionnalites supplementaires comme les profils, les amis et les signalements.

### Repartition du travail

La repartition initiale etait orientee par domaine : Dylan sur le frontend et Khalil sur le backend. Une fois la base du projet stabilisee, les taches ont ete reparties par fonctionnalite, avec un travail sur des branches GitHub separees pour faciliter l'integration.

### Gestion du temps

Le projet s'est appuye sur une base existante, ce qui a permis de limiter le temps passe sur la mise en place technique. La priorite a donc ete donnee a l'integration des fonctionnalites demandees, puis aux tests manuels et aux ameliorations bonus.

### Priorites

Les fonctionnalites obligatoires ont ete traitees en premier. Les ajouts non obligatoires ont ete integres apres validation du socle principal.

### Documentation

La documentation a ete completee au fur et a mesure de l'avancement. Comme le developpement suivait un ordre defini par le sujet, les sections du README reprennent cette progression : installation, structure, API, exemples et bilan d'organisation.
