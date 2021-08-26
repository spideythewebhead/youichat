import { client } from '../db';
import { ValueNotifier } from '../utils/value_notifier';
import { AppUser } from './user';

export class PublicData {
  constructor(public readonly user?: AppUser) {}
}

export class MissingPublicData extends PublicData {}

export class ProfileNotifier extends ValueNotifier<void> {
  constructor() {
    super(null);
  }

  private _uid: string | null = null;
  get uid() {
    return this._uid;
  }
  set uid(id: string | null) {
    this._uid = id;

    if (this._uid) {
      this._fetchProfile();
      return;
    }

    this.updatePublicData(null);
  }

  private _fetchProfile() {
    client
      .from<AppUser>('users')
      .select('id,nickname,image_url')
      .eq('id', this._uid)
      .then((response) => {
        if (response.error) {
          return;
        }

        if (response.data.length === 0) {
          this.updatePublicData(new MissingPublicData());
          return;
        }

        this.updatePublicData(new PublicData(response.data[0]));
      });
  }

  private _publicData: PublicData | null = null;
  get publicData() {
    return this._publicData;
  }

  updatePublicData(data: PublicData | null) {
    this._publicData = data;
    this.notifyListeners();
  }

  async uploadProfilePicture(file: File) {
    const { data, error } = await client.storage
      .from('profile-pictures')
      .upload(`${this._uid}/${file.name}`, file, {
        upsert: true,
      });

    if (data) {
      const { data: update } = await client
        .from<AppUser>('users')
        .update({
          image_url:
            client.storage
              .from('profile-pictures')
              .getPublicUrl(`${this._uid}/${file.name}`).publicURL ?? null,
        })
        .eq('id', this._uid);

      if (update && update.length > 0) {
        this.updatePublicData(new PublicData(update[0]));
        return true;
      }
    }

    return false;
  }
}
