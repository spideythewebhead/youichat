export class AppUser {
  public readonly id: string;
  public readonly nickname: string;
  public readonly image_url: string | null;

  constructor({
    id,
    nickname,
    image_url,
  }: {
    id: string;
    nickname: string;
    image_url: string | null;
  }) {
    this.id = id;
    this.nickname = nickname;
    this.image_url = image_url;
  }
}
