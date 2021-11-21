import { ElevatedButton } from '../components/Button';
import { Card, CardTitle } from '../components/Card';
import { Column } from '../components/Flex';
import { InputField } from '../components/InputField';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { client } from '../db';

export function LoginPage() {
  const { handleSubmit, formState, control } = useForm({ mode: 'onChange' });

  const onSubmit = useCallback(
    async (data: { email: string; password: string }) => {
      const { error } = await client.auth.signIn(data);

      if (error) {
        console.log('something went wrong', error);
        return;
      }
    },
    []
  );

  return (
    <Column mainAxis="justify-center" className="mx-2">
      <Card>
        <CardTitle title="Login" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Column className="space-y-2" crossAxis="items-stretch">
            <Controller
              name="email"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required.',
                },
                maxLength: {
                  value: 30,
                  message: 'Max length is reached.',
                },
                max: 30,
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Invalid email.',
                },
              }}
              render={({ field, fieldState }) => {
                return (
                  <InputField
                    type="text"
                    placeholder="Email"
                    {...field}
                    error={fieldState.error?.message}
                  />
                );
              }}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required.',
                },
                minLength: {
                  value: 6,
                  message: 'Min 6 length.',
                },
              }}
              render={({ field, fieldState }) => {
                return (
                  <InputField
                    type="password"
                    placeholder="Password"
                    {...field}
                    error={fieldState.error?.message}
                  />
                );
              }}
            />

            <ElevatedButton type="submit" disabled={!formState.isValid}>
              Proceed
            </ElevatedButton>
          </Column>
        </form>
      </Card>
    </Column>
  );
}
