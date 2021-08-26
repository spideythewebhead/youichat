import { emojiName } from './emojis';

type EmojiType = typeof emojiName[number];

export interface DBReaction {
  id: number;
  user_id: string;
  reaction: EmojiType;
  message_id: number;
  discussion_id: number;
}

interface Reactions extends Record<EmojiType, DBReaction[]> {}

export interface DBMessage {
  id: number;
  discussion_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  reactions: DBReaction[];
}

export class AppMessage {
  readonly id: number;
  readonly discussion_id: number;
  readonly sender_id: string;
  readonly body: string;
  readonly created_at: string;

  public readonly createdAt: Date;
  public reactions!: Reactions;

  constructor({
    id,
    discussion_id,
    sender_id,
    body,
    created_at,
    reactions,
  }: DBMessage) {
    this.id = id;
    this.sender_id = sender_id;
    this.discussion_id = discussion_id;
    this.body = body;
    this.created_at = created_at;
    this.createdAt = new Date(this.created_at);

    this._groupReactions(reactions);
  }

  private _groupReactions(reactions: DBMessage['reactions']) {
    this.reactions =
      reactions?.reduce(
        (map, reaction) => {
          map[reaction.reaction].push(reaction);
          return map;
        },
        {
          smiley: [],
          like: [],
        } as Reactions
      ) ??
      ({
        smiley: [],
        like: [],
      } as Reactions);
  }

  addReaction(reaction: DBReaction) {
    this.reactions[reaction.reaction].push(reaction);
  }

  removeReaction(reaction: DBReaction) {
    this.reactions[reaction.reaction] = this.reactions[
      reaction.reaction
    ].filter((r) => r.id !== reaction.id);
  }

  anyReactions(): boolean {
    for (const name of Object.keys(this.reactions) as EmojiType[]) {
      if (this.reactions[name].length !== 0) {
        return true;
      }
    }

    return false;
  }

  hasAnyReaction(reaction: EmojiType) {
    return this.reactions[reaction].length !== 0;
  }

  hasReaction(uid: string, reaction: EmojiType) {
    return this.reactions[reaction]?.find(
      (r) => r.user_id === uid && r.reaction === reaction
    );
  }

  hasReactionFromUser(uid: string) {
    for (const name of Object.keys(this.reactions) as EmojiType[]) {
      if (this.reactions[name].find((r) => r.user_id === uid)) {
        return true;
      }
    }

    return false;
  }
}
