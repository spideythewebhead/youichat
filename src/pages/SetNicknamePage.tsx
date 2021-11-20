import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { ElevatedButton } from '../components/Button';
import { Card, CardTitle } from '../components/Card';
import { Column } from '../components/Flex';
import { InputField } from '../components/InputField';
import { client } from '../db';
import { useAuthState, useProfileNotifier } from '../hooks/useAuth';
import { PublicData } from '../models/profile';
import { AppUser } from '../models/user';

export function SetNicknamePage() {
  const history = useHistory();

  const logState = useAuthState();

  const profile = useProfileNotifier();

  const { control, handleSubmit, formState } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (form: { nickname: string }) => {
      setIsSubmitting(true);
      setError(null);

      const { data, error } = await client.from<AppUser>('users').insert({
        nickname: form.nickname,
        id: logState.session!.user!.id,
      });

      setIsSubmitting(false);

      if (error) {
        setError(error.message);
      }

      if (data) {
        profile.updatePublicData(new PublicData(data[0]));
        history.replace('/');
      }
    },
    [logState, profile, history]
  );

  return (
    <Column mainAxis="justify-center" crossAxis="items-center">
      <Card>
        <CardTitle title="Complete Profile" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Column crossAxis="items-stretch" className="space-y-2">
            <Controller
              control={control}
              name="nickname"
              rules={{
                required: 'required',
                minLength: 3,
                pattern: {
                  value: /[\d\w]+/i,
                  message: '',
                },
              }}
              render={({ field }) => (
                <InputField placeholder="set your nickname" {...field} />
              )}
            ></Controller>
            {error && <span className="text-red-700">{error}</span>}

            <ElevatedButton disabled={!formState.isValid || isSubmitting}>
              Submit
            </ElevatedButton>
          </Column>
        </form>
      </Card>
    </Column>
  );
}
