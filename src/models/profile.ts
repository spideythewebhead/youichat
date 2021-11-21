import { client } from '../db';
import { ChangeNotifier } from '../utils/value_notifier';
import { AppUser } from './user';

export const enum ProfileCompletionState {
  waiting,
  completed,
  pendingCompletion,
}

export class Profile extends ChangeNotifier {
  constructor() {
    super();
  }

  private _profileNeedsCompletion = ProfileCompletionState.waiting;
  get profileCompletionState() {
    return this._profileNeedsCompletion;
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

    this.updateUser(null);
  }

  private async _fetchProfile() {
    await client
      .from<AppUser>('users')
      .select('id,nickname,image_url')
      .eq('id', this._uid)
      .then((response) => {
        if (response.error) {
          return;
        }

        if (response.data.length === 0) {
          this._profileNeedsCompletion =
            ProfileCompletionState.pendingCompletion;
          return;
        }

        this._profileNeedsCompletion = ProfileCompletionState.completed;
        this.updateUser(response.data[0]);
      });
  }

  private _user: AppUser | null = null;
  get user() {
    return this._user;
  }

  updateUser(user: AppUser | null) {
    this._user = user;
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
        this.updateUser(update[0]);
        return true;
      }
    }

    return false;
  }
}
